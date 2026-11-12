import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { MailboxConnectionEntity } from './mailbox-connection.entity';
import { EmailParticipant, EmailThreadEntity } from './email-thread.entity';
import { CandidateEntity } from './candidate.entity';
import { ClientEntity } from './client.entity';
import { ClientContactEntity } from './client-contact.entity';
import { UserEntity } from './user.entity';
import { EmailDeliveryStatus, EmailDirection, EmailFolder } from '../enums';

export interface EmailAttachmentMeta {
  filename: string;
  mimeType: string;
  size: number;
  providerAttachmentId: string | null;
}

@Entity('email_messages')
@Index(['mailboxId', 'providerMessageId'], { unique: true })
@Index(['mailboxId', 'internetMessageId'])
@Index(['threadId', 'sentAt'])
@Index(['organizationId', 'sentByUserId', 'sentAt'])
@Index(['organizationId', 'candidateId'])
export class EmailMessageEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  mailboxId: string;

  @Column({ type: 'uuid' })
  threadId: string;

  @Column({ type: 'varchar', length: 255 })
  providerMessageId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  internetMessageId: string | null;

  @Column({ type: 'varchar', length: 320 })
  fromAddress: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  fromName: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  to: EmailParticipant[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  cc: EmailParticipant[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  bcc: EmailParticipant[];

  @Column({ type: 'varchar', length: 500, default: '' })
  subject: string;

  @Column({ type: 'text', nullable: true })
  bodyText: string | null;

  @Column({ type: 'text', nullable: true })
  bodyHtml: string | null;

  @Column({ type: 'varchar', length: 500, default: '' })
  snippet: string;

  @Column({ type: 'timestamptz' })
  sentAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  receivedAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'boolean', default: false })
  isOutbound: boolean;

  @Column({ type: 'enum', enum: EmailDirection })
  direction: EmailDirection;

  @Column({ type: 'enum', enum: EmailFolder, default: EmailFolder.INBOX })
  folder: EmailFolder;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  labels: string[];

  @Column({ type: 'boolean', default: false })
  hasAttachments: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachments: EmailAttachmentMeta[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  inReplyTo: string | null;

  @Column({ type: 'text', nullable: true })
  references: string | null;

  @Column({ type: 'uuid', nullable: true })
  candidateId: string | null;

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @Column({ type: 'uuid', nullable: true })
  clientContactId: string | null;

  @Column({ type: 'uuid', nullable: true })
  sentByUserId: string | null;

  @Column({ type: 'enum', enum: EmailDeliveryStatus, nullable: true })
  deliveryStatus: EmailDeliveryStatus | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => MailboxConnectionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mailboxId' })
  mailbox: MailboxConnectionEntity;

  @ManyToOne(() => EmailThreadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadId' })
  thread: EmailThreadEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity | null;

  @ManyToOne(() => ClientEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity | null;

  @ManyToOne(() => ClientContactEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'clientContactId' })
  clientContact: ClientContactEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sentByUserId' })
  sentByUser: UserEntity | null;
}
