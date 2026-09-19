import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WebPushSubscriptionEntity } from '../entities';

@Injectable()
export class WebPushSubscriptionRepository extends Repository<WebPushSubscriptionEntity> {
  constructor(private dataSource: DataSource) {
    super(WebPushSubscriptionEntity, dataSource.createEntityManager());
  }

  async findByUser(
    organizationId: string,
    userId: string,
  ): Promise<WebPushSubscriptionEntity[]> {
    return this.find({ where: { organizationId, userId } });
  }

  async upsertSubscription(input: {
    organizationId: string;
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string | null;
  }): Promise<void> {
    await this.upsert(input, { conflictPaths: ['endpoint'] });
  }

  async deleteForUser(
    endpoint: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.delete({ endpoint, organizationId, userId });
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.delete({ endpoint });
  }
}
