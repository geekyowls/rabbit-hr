import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BillingWebhookEventEntity } from '../entities';

@Injectable()
export class BillingWebhookEventRepository extends Repository<BillingWebhookEventEntity> {
  constructor(private dataSource: DataSource) {
    super(BillingWebhookEventEntity, dataSource.createEntityManager());
  }
}
