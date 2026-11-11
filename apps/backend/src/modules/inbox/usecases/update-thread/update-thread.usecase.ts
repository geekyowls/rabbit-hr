import { BadRequestException, Injectable } from '@nestjs/common';
import { In, Not } from 'typeorm';
import { EmailThreadEntity } from '@db/entities';
import { EmailFolder } from '@db/enums';
import {
  ApplicationRepository,
  EmailMessageRepository,
  EmailThreadRepository,
} from '@db/repositories';
import { MailboxAccessService } from '@modules/mailbox/services/mailbox-access.service';
import { MailboxStoreService } from '@modules/mailbox/services/mailbox-store.service';
import { EmailLinkerService } from '@modules/mailbox/services/email-linker.service';
import { findAccessibleThread, toThreadRow } from '../thread-query';
import { UpdateThreadCommand } from './update-thread.command';

@Injectable()
export class UpdateThread {
  constructor(
    private readonly threadRepository: EmailThreadRepository,
    private readonly messageRepository: EmailMessageRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly accessService: MailboxAccessService,
    private readonly store: MailboxStoreService,
    private readonly linker: EmailLinkerService,
  ) {}

  async execute(command: UpdateThreadCommand) {
    const mailboxIds = await this.accessService.resolveIds(
      command.organizationId,
      command.userId,
    );
    const loaded = await findAccessibleThread(
      this.threadRepository,
      command.organizationId,
      mailboxIds,
      command.threadId,
    );
    const thread = await this.threadRepository.findOneByOrFail({
      id: loaded.id,
    });
    const forceRefolder = new Set<string>();

    if (command.isRead !== undefined) {
      await this.setRead(thread.id, command.isRead);
    }
    const target =
      command.folder ??
      (command.isArchived === undefined
        ? undefined
        : command.isArchived
          ? EmailFolder.ARCHIVE
          : EmailFolder.INBOX);
    if (target) {
      await this.move(thread, target);
      if (target !== EmailFolder.ARCHIVE) forceRefolder.add(thread.id);
    }
    const relinked = await this.applyLinks(thread, command);
    await this.threadRepository.save(thread);
    await this.store.refreshThreads([thread.id], forceRefolder);

    if (relinked) {
      const messages = await this.messageRepository.find({
        where: { threadId: thread.id },
      });
      const refreshed = await this.threadRepository.findOneByOrFail({
        id: thread.id,
      });
      await this.linker.recordActivities(
        messages,
        new Map([[refreshed.id, refreshed]]),
      );
    }

    return toThreadRow(
      await findAccessibleThread(
        this.threadRepository,
        command.organizationId,
        mailboxIds,
        thread.id,
      ),
    );
  }

  private async setRead(threadId: string, isRead: boolean) {
    if (isRead) {
      await this.messageRepository.update(
        { threadId, isRead: false },
        { isRead: true },
      );
      return;
    }
    const latest = await this.messageRepository.findOne({
      where: { threadId, isOutbound: false },
      order: { sentAt: 'DESC' },
      select: ['id'],
    });
    if (latest) {
      await this.messageRepository.update(latest.id, { isRead: false });
    }
  }

  private async move(thread: EmailThreadEntity, folder: EmailFolder) {
    if (folder === EmailFolder.ARCHIVE) {
      await this.messageRepository.update(
        { threadId: thread.id, folder: EmailFolder.INBOX },
        { folder: EmailFolder.ARCHIVE },
      );
    } else if (folder === EmailFolder.TRASH) {
      await this.messageRepository.update(
        { threadId: thread.id, folder: Not(EmailFolder.TRASH) },
        { folder: EmailFolder.TRASH },
      );
    } else {
      await this.messageRepository.update(
        {
          threadId: thread.id,
          isOutbound: false,
          folder: In([EmailFolder.ARCHIVE, EmailFolder.TRASH]),
        },
        { folder: EmailFolder.INBOX },
      );
      await this.messageRepository.update(
        { threadId: thread.id, isOutbound: true, folder: EmailFolder.TRASH },
        { folder: EmailFolder.SENT },
      );
    }
    thread.folder = folder;
    thread.isArchived = folder === EmailFolder.ARCHIVE;
  }

  private async applyLinks(
    thread: EmailThreadEntity,
    command: UpdateThreadCommand,
  ): Promise<boolean> {
    const { organizationId } = command;
    let candidateId = command.candidateId;
    const clientId = command.clientId;

    if (command.applicationId !== undefined) {
      if (command.applicationId) {
        const application = await this.applicationRepository.findOne({
          where: { id: command.applicationId, organizationId },
          select: ['id', 'candidateId'],
        });
        if (!application) {
          throw new BadRequestException('Application not found');
        }
        candidateId ??= application.candidateId;
      }
      thread.applicationId = command.applicationId;
    }

    const exists = await this.linker.ensureEntitiesExist(organizationId, {
      candidateId,
      clientId,
    });
    if (!exists.candidate) throw new BadRequestException('Candidate not found');
    if (!exists.client) throw new BadRequestException('Client not found');

    const patch: { candidateId?: string | null; clientId?: string | null } = {};
    if (candidateId !== undefined) {
      thread.candidateId = candidateId;
      patch.candidateId = candidateId;
    }
    if (clientId !== undefined) {
      thread.clientId = clientId;
      patch.clientId = clientId;
    }
    if (Object.keys(patch).length === 0) return false;
    await this.messageRepository.update({ threadId: thread.id }, patch);
    return Boolean(patch.candidateId || patch.clientId);
  }
}
