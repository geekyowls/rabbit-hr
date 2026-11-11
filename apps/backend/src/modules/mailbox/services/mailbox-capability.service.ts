import { Injectable } from '@nestjs/common';
import { MailboxConnectionStatus, MailboxProvider } from '@db/enums';
import { MailboxConnectionRepository } from '@db/repositories';

export interface MailboxCapability {
  connected: boolean;
  provider: MailboxProvider | null;
  emailAddress: string | null;
  isDemo: boolean;
}

@Injectable()
export class MailboxCapabilityService {
  constructor(
    private readonly connectionRepository: MailboxConnectionRepository,
  ) {}

  async getForUser(
    organizationId: string,
    userId: string,
  ): Promise<MailboxCapability> {
    const mailboxes = await this.connectionRepository
      .createQueryBuilder('mailbox')
      .select([
        'mailbox.id',
        'mailbox.provider',
        'mailbox.emailAddress',
        'mailbox.status',
        'mailbox.isDemo',
        'mailbox.isShared',
      ])
      .where('mailbox.organizationId = :organizationId', { organizationId })
      .andWhere('(mailbox.userId = :userId OR mailbox.isShared = true)', {
        userId,
      })
      .orderBy('mailbox.isShared', 'ASC')
      .addOrderBy('mailbox.createdAt', 'ASC')
      .getMany();
    const mailbox =
      mailboxes.find(
        (item) => item.status === MailboxConnectionStatus.CONNECTED,
      ) ?? mailboxes[0];
    return {
      connected: mailbox?.status === MailboxConnectionStatus.CONNECTED,
      provider: mailbox?.provider ?? null,
      emailAddress: mailbox?.emailAddress ?? null,
      isDemo: mailbox?.isDemo ?? false,
    };
  }
}
