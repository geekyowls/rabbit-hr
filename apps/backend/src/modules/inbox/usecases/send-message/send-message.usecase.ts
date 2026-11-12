import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  EmailMessageEntity,
  EmailParticipant,
  EmailThreadEntity,
  MailboxConnectionEntity,
} from '@db/entities';
import {
  EmailDeliveryStatus,
  EmailFolder,
  MailboxConnectionStatus,
} from '@db/enums';
import {
  EmailMessageRepository,
  EmailTemplateRepository,
  EmailThreadRepository,
  MailboxConnectionRepository,
} from '@db/repositories';
import {
  renderMergeFields,
  textToHtml,
} from '@modules/email-template/usecases/render-merge-fields';
import { MailboxAccessService } from '@modules/mailbox/services/mailbox-access.service';
import { MailboxStoreService } from '@modules/mailbox/services/mailbox-store.service';
import { MailboxSyncService } from '@modules/mailbox/services/mailbox-sync.service';
import { MailboxTokenService } from '@modules/mailbox/services/mailbox-token.service';
import { EmailLinkerService } from '@modules/mailbox/services/email-linker.service';
import { DEMO_PROVIDER_ID_PREFIX } from '@modules/mailbox/mailbox.constants';
import {
  MailboxAuthError,
  OutgoingEmail,
  ProviderSendResult,
} from '@modules/mailbox/providers/mail-provider.types';
import {
  normalizeEmail,
  uniqueParticipants,
} from '@modules/mailbox/helpers/email-address';
import {
  buildSnippet,
  emailHtmlToText,
  sanitizeEmailHtml,
} from '@modules/mailbox/helpers/sanitize-email-html';
import {
  toMessageRow,
  toThreadRow,
  findAccessibleThread,
} from '../thread-query';
import { InboxMergeValues } from './merge-values.service';
import { SendMessageCommand } from './send-message.command';

function replySubject(subject: string): string {
  return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`;
}

@Injectable()
export class SendInboxMessage {
  constructor(
    private readonly threadRepository: EmailThreadRepository,
    private readonly messageRepository: EmailMessageRepository,
    private readonly templateRepository: EmailTemplateRepository,
    private readonly connectionRepository: MailboxConnectionRepository,
    private readonly accessService: MailboxAccessService,
    private readonly tokenService: MailboxTokenService,
    private readonly syncService: MailboxSyncService,
    private readonly store: MailboxStoreService,
    private readonly linker: EmailLinkerService,
    private readonly mergeValues: InboxMergeValues,
  ) {}

  async execute(command: SendMessageCommand) {
    const { organizationId, userId } = command;
    const mailboxes = await this.accessService.listAccessible(
      organizationId,
      userId,
    );
    if (mailboxes.length === 0) {
      throw new ConflictException('No mailbox connected');
    }

    const thread = command.threadId
      ? await this.threadRepository.findOneBy({
          id: (
            await findAccessibleThread(
              this.threadRepository,
              organizationId,
              mailboxes.map((mailbox) => mailbox.id),
              command.threadId,
            )
          ).id,
        })
      : null;
    const mailbox = this.pickMailbox(mailboxes, command, thread);
    const replyTo = thread ? await this.findReplyTarget(thread, command) : null;

    const template = command.templateId
      ? await this.templateRepository.findOne({
          where: { id: command.templateId, organizationId },
        })
      : null;
    if (command.templateId && !template) {
      throw new NotFoundException('Email template not found');
    }

    const merge = await this.mergeValues.load({
      organizationId,
      userId,
      candidateId: command.candidateId ?? thread?.candidateId ?? null,
      applicationId: command.applicationId ?? thread?.applicationId ?? null,
    });

    const subjectSource =
      command.subject ??
      template?.subject ??
      (thread ? replySubject(thread.subject) : null);
    if (!subjectSource) {
      throw new BadRequestException('Subject is required');
    }
    const htmlSource =
      command.html ?? (template ? textToHtml(template.body) : null);
    if (!htmlSource) {
      throw new BadRequestException('Message body is required');
    }
    const subject = renderMergeFields(subjectSource, merge.values).trim();
    const html =
      sanitizeEmailHtml(renderMergeFields(htmlSource, merge.values)) ?? '';
    const text = emailHtmlToText(html);

    const to = this.recipients(command.to, replyTo, mailbox);
    if (to.length === 0) {
      throw new BadRequestException('Add at least one recipient');
    }
    const cc = uniqueParticipants(command.cc);
    const bcc = uniqueParticipants(command.bcc);
    const references = replyTo
      ? [replyTo.references, replyTo.internetMessageId]
          .filter(Boolean)
          .join(' ') || null
      : null;

    const outgoing: OutgoingEmail = {
      from: {
        email: mailbox.emailAddress,
        name: mailbox.displayName ?? merge.senderName,
      },
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      inReplyTo: replyTo?.internetMessageId ?? null,
      references,
      providerThreadId: thread?.providerThreadId ?? null,
      replyToProviderMessageId: replyTo?.providerMessageId ?? null,
    };

    const { result, deliveryStatus } = await this.deliver(mailbox, outgoing);
    const sentAt = new Date();

    const index = await this.linker.buildIndex(
      organizationId,
      [...to, ...cc, ...bcc].map((participant) => participant.email),
    );
    const autoLink = this.linker.match(
      index,
      { fromAddress: mailbox.emailAddress, to, cc, bcc, isOutbound: true },
      mailbox.emailAddress,
    );

    const stored = await this.store.storeOutbound({
      mailbox,
      thread,
      sentByUserId: userId,
      deliveryStatus,
      link: {
        candidateId:
          command.candidateId ?? merge.candidateId ?? autoLink.candidateId,
        clientId: command.clientId ?? merge.clientId ?? autoLink.clientId,
        clientContactId: autoLink.clientContactId,
        applicationId: command.applicationId ?? null,
      },
      message: {
        providerMessageId: result.providerMessageId,
        providerThreadId: result.providerThreadId,
        internetMessageId: result.internetMessageId,
        inReplyTo: outgoing.inReplyTo,
        references,
        subject,
        from: outgoing.from,
        to,
        cc,
        bcc,
        bodyText: text,
        bodyHtml: html,
        snippet: buildSnippet(text),
        sentAt,
        receivedAt: null,
        isRead: true,
        isOutbound: true,
        folder: EmailFolder.SENT,
        labels: ['SENT'],
        hasAttachments: false,
        attachments: [],
      },
    });

    const reloaded = await findAccessibleThread(
      this.threadRepository,
      organizationId,
      [mailbox.id],
      stored.thread.id,
    );
    return {
      thread: toThreadRow(reloaded),
      message: toMessageRow(stored.message),
      deliveryStatus,
    };
  }

  private pickMailbox(
    mailboxes: MailboxConnectionEntity[],
    command: SendMessageCommand,
    thread: EmailThreadEntity | null,
  ): MailboxConnectionEntity {
    const requestedId = thread?.mailboxId ?? command.mailboxId;
    const connected = mailboxes.filter(
      (mailbox) => mailbox.status === MailboxConnectionStatus.CONNECTED,
    );
    const mailbox = requestedId
      ? mailboxes.find((item) => item.id === requestedId)
      : (connected.find((item) => item.userId === command.userId) ??
        connected[0]);
    if (!mailbox) {
      if (requestedId) throw new NotFoundException('Mailbox not found');
      throw new ConflictException('Mailbox needs to be reconnected');
    }
    if (mailbox.status !== MailboxConnectionStatus.CONNECTED) {
      throw new ConflictException('Mailbox needs to be reconnected');
    }
    return mailbox;
  }

  private async findReplyTarget(
    thread: EmailThreadEntity,
    command: SendMessageCommand,
  ): Promise<EmailMessageEntity | null> {
    if (command.inReplyToMessageId) {
      const message = await this.messageRepository.findOneBy({
        id: command.inReplyToMessageId,
        threadId: thread.id,
      });
      if (!message) throw new NotFoundException('Message not found');
      return message;
    }
    return this.messageRepository.findOne({
      where: { threadId: thread.id },
      order: { sentAt: 'DESC' },
    });
  }

  private recipients(
    requested: Array<{ email: string; name?: string | null }>,
    replyTo: EmailMessageEntity | null,
    mailbox: MailboxConnectionEntity,
  ): EmailParticipant[] {
    if (requested.length > 0) return uniqueParticipants(requested);
    if (!replyTo) return [];
    const own = normalizeEmail(mailbox.emailAddress);
    const fallback = replyTo.isOutbound
      ? replyTo.to
      : [{ email: replyTo.fromAddress, name: replyTo.fromName }];
    return uniqueParticipants(fallback).filter(
      (participant) => participant.email !== own,
    );
  }

  private async deliver(
    mailbox: MailboxConnectionEntity,
    email: OutgoingEmail,
  ): Promise<{
    result: ProviderSendResult;
    deliveryStatus: EmailDeliveryStatus;
  }> {
    if (mailbox.isDemo) {
      const id = crypto.randomUUID();
      return {
        deliveryStatus: EmailDeliveryStatus.DEMO,
        result: {
          providerMessageId: `${DEMO_PROVIDER_ID_PREFIX}${id}`,
          providerThreadId:
            email.providerThreadId ?? `${DEMO_PROVIDER_ID_PREFIX}thread-${id}`,
          internetMessageId: `<${id}@demo.rabbithr.local>`,
        },
      };
    }
    const withSecrets = await this.tokenService.loadWithSecrets(mailbox.id);
    if (!withSecrets) throw new NotFoundException('Mailbox not found');
    try {
      const accessToken = await this.tokenService.getAccessToken(withSecrets);
      const result = await this.syncService
        .adapter(mailbox.provider)
        .send(accessToken, email);
      return { result, deliveryStatus: EmailDeliveryStatus.SENT };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof MailboxAuthError) {
        await this.connectionRepository.update(mailbox.id, {
          status: MailboxConnectionStatus.EXPIRED,
          errorMessage: message.slice(0, 500),
        });
        throw new ConflictException('Mailbox needs to be reconnected');
      }
      throw new BadGatewayException(`Email not sent: ${message}`);
    }
  }
}
