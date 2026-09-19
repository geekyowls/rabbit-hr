import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('web_push_subscriptions')
@Index(['organizationId', 'userId'])
@Index(['endpoint'], { unique: true })
export class WebPushSubscriptionEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'varchar', length: 255 })
  p256dh: string;

  @Column({ type: 'varchar', length: 255 })
  auth: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
