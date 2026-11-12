import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('billing_webhook_events')
@Index(['provider', 'webhookId'], { unique: true })
export class BillingWebhookEventEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'varchar', length: 200 })
  webhookId: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string | null;
}
