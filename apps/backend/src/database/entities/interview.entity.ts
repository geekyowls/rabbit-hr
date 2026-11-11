import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CandidateEntity } from './candidate.entity';
import { ApplicationEntity } from './application.entity';
import { JobEntity } from './job.entity';
import { InterviewStatus, InterviewType } from '../enums';

@Entity('interviews')
@Index(['organizationId', 'scheduledAt'])
@Index(['organizationId', 'applicationId'])
@Index(['organizationId', 'jobId'])
@Index(['organizationId', 'candidateId'])
@Index(['organizationId', 'status'])
export class InterviewEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'enum', enum: InterviewType, default: InterviewType.VIDEO })
  type: InterviewType;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 64 })
  timezone: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meetingUrl: string | null;

  @Column({ type: 'uuid', array: true, default: '{}' })
  interviewerIds: string[];

  @Column({ type: 'uuid', nullable: true })
  organizerId: string | null;

  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancelledReason: string | null;

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
  @JoinColumn({ name: 'organizerId' })
  organizer: UserEntity | null;
}
