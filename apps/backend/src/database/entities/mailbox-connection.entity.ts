import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { MailboxConnectionStatus, MailboxProvider } from '../enums';

@Entity('mailbox_connections')
@Index(['organizationId', 'provider', 'emailAddress'], { unique: true })
@Index(['organizationId', 'userId'])
export class MailboxConnectionEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'uuid', nullable: true })
  connectedById: string | null;

  @Column({ type: 'enum', enum: MailboxProvider })
  provider: MailboxProvider;

  @Column({ type: 'varchar', length: 320 })
  emailAddress: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  displayName: string | null;

  @Column({ type: 'boolean', default: false })
  isShared: boolean;

  @Column({ type: 'text', nullable: true, select: false })
  encryptedTokens: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  tokenExpiresAt: Date | null;

  @Column({
    type: 'enum',
    enum: MailboxConnectionStatus,
    default: MailboxConnectionStatus.CONNECTED,
  })
  status: MailboxConnectionStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  syncCursor: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ type: 'boolean', default: true })
  syncEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  isDemo: boolean;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'connectedById' })
  connectedBy: UserEntity | null;
}
