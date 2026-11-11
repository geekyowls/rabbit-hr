import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { MailboxConnectionEntity } from './mailbox-connection.entity';
import { CandidateEntity } from './candidate.entity';
import { ClientEntity } from './client.entity';
import { ApplicationEntity } from './application.entity';
import { EmailFolder } from '../enums';

export interface EmailParticipant {
  email: string;
  name: string | null;
}

@Entity('email_threads')
@Index(['mailboxId', 'providerThreadId'], { unique: true })
@Index(['organizationId', 'mailboxId', 'folder', 'lastMessageAt'])
@Index(['organizationId', 'candidateId'])
@Index(['organizationId', 'clientId'])
export class EmailThreadEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  mailboxId: string;

  @Column({ type: 'varchar', length: 255 })
  providerThreadId: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  subject: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  snippet: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  participants: EmailParticipant[];

  @Column({ type: 'timestamptz' })
  lastMessageAt: Date;

  @Column({ type: 'int', default: 0 })
  unreadCount: number;

  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @Column({ type: 'boolean', default: false })
  hasAttachments: boolean;

  @Column({ type: 'enum', enum: EmailFolder, default: EmailFolder.INBOX })
  folder: EmailFolder;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  labels: string[];

  @Column({ type: 'uuid', nullable: true })
  candidateId: string | null;

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => MailboxConnectionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mailboxId' })
  mailbox: MailboxConnectionEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity | null;

  @ManyToOne(() => ClientEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity | null;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: ApplicationEntity | null;
}
