import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CandidateEntity } from './candidate.entity';
import { JobEntity } from './job.entity';
import { CandidateSource } from '../enums';

export interface ApplicationAnswer {
  questionId: string;
  question?: string;
  answer: string;
}

@Entity('applications')
@Index(['candidateId', 'jobId'], { unique: true })
@Index(['organizationId', 'stage'])
@Index(['organizationId', 'jobId'])
@Index(['organizationId', 'appliedAt'])
export class ApplicationEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'varchar', length: 64, default: 'applied' })
  stage: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'boolean', default: false })
  shortlisted: boolean;

  @Column({
    type: 'enum',
    enum: CandidateSource,
    default: CandidateSource.OTHER,
  })
  source: CandidateSource;

  @Column({ type: 'jsonb', nullable: true })
  answers: ApplicationAnswer[] | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  stageChangedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt: Date;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity;

  @ManyToOne(() => JobEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: JobEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity | null;
}
