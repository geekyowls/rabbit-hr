import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CandidateEntity } from './candidate.entity';
import { ApplicationEntity } from './application.entity';
import { DocumentType, DocumentVerificationStatus } from '../enums';

@Entity('candidate_documents')
@Index(['organizationId', 'candidateId'])
export class CandidateDocumentEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  type: DocumentType;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  fileKey: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  mimeType: string | null;

  @Column({ type: 'int', nullable: true })
  sizeBytes: number | null;

  @Column({
    type: 'enum',
    enum: DocumentVerificationStatus,
    default: DocumentVerificationStatus.PENDING,
  })
  verificationStatus: DocumentVerificationStatus;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'date', nullable: true })
  expiresAt: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: ApplicationEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier: UserEntity | null;
}
