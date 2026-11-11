import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CandidateEntity } from './candidate.entity';
import { ApplicationEntity } from './application.entity';
import { WhatsappTemplateEntity } from './whatsapp-template.entity';
import { WhatsappMessageStatus } from '../enums';

@Entity('whatsapp_messages')
@Index(['organizationId', 'createdAt'])
@Index(['organizationId', 'candidateId', 'createdAt'])
@Index(['organizationId', 'dedupeKey'])
export class WhatsappMessageEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({ type: 'varchar', length: 255 })
  templateName: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  variables: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  renderedBody: string | null;

  @Column({
    type: 'enum',
    enum: WhatsappMessageStatus,
    default: WhatsappMessageStatus.QUEUED,
  })
  status: WhatsappMessageStatus;

  @Column({ type: 'varchar', length: 40, nullable: true })
  errorCategory: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerMessageId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dedupeKey: string | null;

  @Column({ type: 'uuid', nullable: true })
  sentBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: ApplicationEntity | null;

  @ManyToOne(() => WhatsappTemplateEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'templateId' })
  template: WhatsappTemplateEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sentBy' })
  sender: UserEntity | null;
}
