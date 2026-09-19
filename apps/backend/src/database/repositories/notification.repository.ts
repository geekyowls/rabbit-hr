import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { NotificationEntity } from '../entities';

@Injectable()
export class NotificationRepository extends Repository<NotificationEntity> {
  constructor(private dataSource: DataSource) {
    super(NotificationEntity, dataSource.createEntityManager());
  }

  async createMany(
    rows: DeepPartial<NotificationEntity>[],
  ): Promise<NotificationEntity[]> {
    if (rows.length === 0) return [];
    return this.save(this.create(rows));
  }

  async findFeedForUser(
    organizationId: string,
    recipientUserId: string,
    limit = 30,
  ): Promise<NotificationEntity[]> {
    return this.find({
      where: { organizationId, recipientUserId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countUnread(
    organizationId: string,
    recipientUserId: string,
  ): Promise<number> {
    return this.count({
      where: { organizationId, recipientUserId, isRead: false },
    });
  }

  async markRead(
    id: string,
    organizationId: string,
    recipientUserId: string,
  ): Promise<void> {
    await this.update(
      { id, organizationId, recipientUserId },
      { isRead: true, readAt: new Date() },
    );
  }

  async markAllRead(
    organizationId: string,
    recipientUserId: string,
  ): Promise<void> {
    await this.update(
      { organizationId, recipientUserId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }
}
