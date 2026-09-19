import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

export type NotificationPriority = 'info' | 'warning' | 'critical';

@Entity('notifications')
@Index(['organizationId', 'recipientUserId', 'isRead'])
@Index(['organizationId', 'recipientUserId', 'createdAt'])
export class NotificationEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  recipientUserId: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  link: string | null;

  @Column({ type: 'varchar', length: 20, default: 'info' })
  priority: NotificationPriority;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientUserId' })
  recipientUser: UserEntity;
}
