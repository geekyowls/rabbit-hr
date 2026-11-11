import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CandidateEntity } from './candidate.entity';
import { ApplicationEntity } from './application.entity';
import { JobEntity } from './job.entity';
import { numericTransformer } from '../numeric.transformer';
import {
  EmploymentType,
  OfferDecision,
  OfferStatus,
  SalaryPeriod,
} from '../enums';

export interface OfferApproval {
  userId: string;
  decision: OfferDecision;
  comment: string | null;
  decidedAt: string;
}

@Entity('offers')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'applicationId'])
@Index(['organizationId', 'jobId'])
@Index(['organizationId', 'candidateId'])
export class OfferEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.DRAFT })
  status: OfferStatus;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  salaryAmount: number | null;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'enum', enum: SalaryPeriod, default: SalaryPeriod.YEAR })
  salaryPeriod: SalaryPeriod;

  @Column({ type: 'varchar', length: 200, nullable: true })
  bonus: string | null;

  @Column({ type: 'text', nullable: true })
  equity: string | null;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  expiresAt: string | null;

  @Column({ type: 'enum', enum: EmploymentType, nullable: true })
  employmentType: EmploymentType | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'uuid', array: true, default: '{}' })
  approverIds: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  approvals: OfferApproval[];

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  respondedAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  declineReason: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  signToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  signTokenExpiresAt: Date | null;

  @Column({ type: 'text', nullable: true })
  sentLetterBody: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  signedAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  signedName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  signedIp: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  signedUserAgent: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  signatureHash: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: ApplicationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity;

  @ManyToOne(() => JobEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: JobEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity | null;
}
