import { Injectable } from '@nestjs/common';
import { EmailMessageEntity, EmailThreadEntity } from '@db/entities';
import {
  ActivityRepository,
  CandidateRepository,
  ClientContactRepository,
  ClientRepository,
} from '@db/repositories';
import { ActivityType } from '@db/enums';
import { normalizeEmail, truncate } from '../helpers/email-address';

export interface EmailLinkMatch {
  candidateId: string | null;
  clientId: string | null;
  clientContactId: string | null;
}

export interface EmailLinkIndex {
  candidates: Map<string, string>;
  contacts: Map<string, { id: string; clientId: string }>;
  clients: Map<string, string>;
}

type LinkableMessage = Pick<
  EmailMessageEntity,
  'fromAddress' | 'to' | 'cc' | 'bcc' | 'isOutbound'
>;

@Injectable()
export class EmailLinkerService {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly clientContactRepository: ClientContactRepository,
    private readonly clientRepository: ClientRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async buildIndex(
    organizationId: string,
    emails: string[],
  ): Promise<EmailLinkIndex> {
    const unique = [...new Set(emails.map(normalizeEmail))].filter(Boolean);
    const index: EmailLinkIndex = {
      candidates: new Map(),
      contacts: new Map(),
      clients: new Map(),
    };
    if (unique.length === 0) return index;

    const [candidates, contacts, clients] = await Promise.all([
      this.candidateRepository
        .createQueryBuilder('candidate')
        .select(['candidate.id', 'candidate.email'])
        .where('candidate.organizationId = :organizationId', { organizationId })
        .andWhere('LOWER(candidate.email) IN (:...emails)', { emails: unique })
        .getMany(),
      this.clientContactRepository
        .createQueryBuilder('contact')
        .select(['contact.id', 'contact.clientId', 'contact.email'])
        .where('contact.organizationId = :organizationId', { organizationId })
        .andWhere('LOWER(contact.email) IN (:...emails)', { emails: unique })
        .getMany(),
      this.clientRepository
        .createQueryBuilder('client')
        .select(['client.id', 'client.email'])
        .where('client.organizationId = :organizationId', { organizationId })
        .andWhere('LOWER(client.email) IN (:...emails)', { emails: unique })
        .getMany(),
    ]);
    for (const candidate of candidates) {
      index.candidates.set(normalizeEmail(candidate.email), candidate.id);
    }
    for (const contact of contacts) {
      if (contact.email) {
        index.contacts.set(normalizeEmail(contact.email), {
          id: contact.id,
          clientId: contact.clientId,
        });
      }
    }
    for (const client of clients) {
      if (client.email) {
        index.clients.set(normalizeEmail(client.email), client.id);
      }
    }
    return index;
  }

  counterpartEmails(message: LinkableMessage, mailboxEmail: string): string[] {
    const own = normalizeEmail(mailboxEmail);
    const recipients = [...message.to, ...message.cc, ...message.bcc].map(
      (participant) => participant.email,
    );
    const emails = message.isOutbound
      ? recipients
      : [message.fromAddress, ...recipients];
    return emails.map(normalizeEmail).filter((email) => email !== own);
  }

  match(
    index: EmailLinkIndex,
    message: LinkableMessage,
    mailboxEmail: string,
  ): EmailLinkMatch {
    const emails = this.counterpartEmails(message, mailboxEmail);
    const candidateEmail = emails.find((email) => index.candidates.has(email));
    const contactEmail = emails.find((email) => index.contacts.has(email));
    const clientEmail = emails.find((email) => index.clients.has(email));
    const contact = contactEmail ? index.contacts.get(contactEmail)! : null;
    return {
      candidateId: candidateEmail
        ? index.candidates.get(candidateEmail)!
        : null,
      clientId:
        contact?.clientId ??
        (clientEmail ? index.clients.get(clientEmail)! : null),
      clientContactId: contact?.id ?? null,
    };
  }

  async recordActivities(
    messages: EmailMessageEntity[],
    threads: Map<string, EmailThreadEntity>,
  ): Promise<number> {
    const linked = messages.filter(
      (message) => message.candidateId || message.clientId,
    );
    if (linked.length === 0) return 0;

    const existing = await this.activityRepository
      .createQueryBuilder('activity')
      .select("activity.metadata->>'emailMessageId'", 'emailMessageId')
      .where('activity.organizationId = :organizationId', {
        organizationId: linked[0].organizationId,
      })
      .andWhere('activity.type = :type', { type: ActivityType.EMAIL })
      .andWhere("activity.metadata->>'emailMessageId' IN (:...ids)", {
        ids: linked.map((message) => message.id),
      })
      .getRawMany<{ emailMessageId: string }>();
    const seen = new Set(existing.map((row) => row.emailMessageId));

    const rows = linked
      .filter((message) => !seen.has(message.id))
      .map((message) => {
        const thread = threads.get(message.threadId);
        const verb = message.isOutbound ? 'Email sent' : 'Email received';
        return this.activityRepository.create({
          organizationId: message.organizationId,
          candidateId: message.candidateId,
          clientId: message.clientId,
          applicationId: thread?.applicationId ?? null,
          type: ActivityType.EMAIL,
          title: truncate(`${verb}: ${message.subject || '(no subject)'}`, 250),
          body: message.snippet || null,
          metadata: {
            source: 'inbox',
            emailMessageId: message.id,
            threadId: message.threadId,
            mailboxId: message.mailboxId,
            direction: message.direction,
            from: message.fromAddress,
            to: message.to.map((participant) => participant.email),
            subject: message.subject,
          },
          actorId: message.sentByUserId,
          createdAt: message.sentAt,
        });
      });
    if (rows.length > 0) {
      await this.activityRepository.save(rows, { chunk: 100 });
    }
    return rows.length;
  }

  async ensureEntitiesExist(
    organizationId: string,
    ids: { candidateId?: string | null; clientId?: string | null },
  ): Promise<{ candidate: boolean; client: boolean }> {
    const [candidate, client] = await Promise.all([
      ids.candidateId
        ? this.candidateRepository.exists({
            where: { id: ids.candidateId, organizationId },
          })
        : true,
      ids.clientId
        ? this.clientRepository.exists({
            where: { id: ids.clientId, organizationId },
          })
        : true,
    ]);
    return { candidate, client };
  }
}
