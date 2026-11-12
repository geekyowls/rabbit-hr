import { Injectable, NotFoundException } from '@nestjs/common';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import { MailboxConnectionEntity } from '@db/entities';
import { MailboxConnectionRepository } from '@db/repositories';

@Injectable()
export class MailboxAccessService {
  constructor(
    private readonly connectionRepository: MailboxConnectionRepository,
  ) {}

  listAccessible(
    organizationId: string,
    userId: string,
  ): Promise<MailboxConnectionEntity[]> {
    return this.connectionRepository
      .createQueryBuilder('mailbox')
      .where('mailbox.organizationId = :organizationId', { organizationId })
      .andWhere('(mailbox.userId = :userId OR mailbox.isShared = true)', {
        userId,
      })
      .orderBy('mailbox.isShared', 'ASC')
      .addOrderBy('mailbox.createdAt', 'ASC')
      .getMany();
  }

  async getAccessible(
    organizationId: string,
    userId: string,
    mailboxId: string,
  ): Promise<MailboxConnectionEntity> {
    const mailboxes = await this.listAccessible(organizationId, userId);
    const mailbox = mailboxes.find((item) => item.id === mailboxId);
    if (!mailbox) {
      throw new NotFoundException('Mailbox not found');
    }
    return mailbox;
  }

  async resolveIds(
    organizationId: string,
    userId: string,
    mailboxId?: string,
  ): Promise<string[]> {
    if (mailboxId) {
      return [(await this.getAccessible(organizationId, userId, mailboxId)).id];
    }
    const mailboxes = await this.listAccessible(organizationId, userId);
    return mailboxes.map((mailbox) => mailbox.id);
  }

  canManage(
    mailbox: MailboxConnectionEntity,
    userId: string,
    permissions: string[],
  ): boolean {
    if (mailbox.isShared) {
      return permissions.includes(PERMISSIONS_ENUM.MAILBOX_SHARED_MANAGE);
    }
    return mailbox.userId === userId;
  }
}
