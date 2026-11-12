import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { ApplicationEntity } from './application.entity';
import { CandidateEntity } from './candidate.entity';
import { JobEntity } from './job.entity';
import { InterviewEntity } from './interview.entity';
import {
  InterviewBookingLinkStatus,
  InterviewBookingMode,
  InterviewMeetingProvider,
  InterviewType,
} from '../enums';

@Entity('interview_booking_links')
@Index(['organizationId', 'applicationId'])
@Index(['organizationId', 'status'])
export class InterviewBookingLinkEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'enum', enum: InterviewType, default: InterviewType.VIDEO })
  type: InterviewType;

  @Column({ type: 'int', default: 30 })
  durationMinutes: number;

  @Column({ type: 'uuid', array: true, default: '{}' })
  interviewerIds: string[];

  @Column({
    type: 'enum',
    enum: InterviewBookingMode,
    default: InterviewBookingMode.ANY_INTERVIEWER,
  })
  mode: InterviewBookingMode;

  @Column({
    type: 'enum',
    enum: InterviewMeetingProvider,
    default: InterviewMeetingProvider.NONE,
  })
  meetingProvider: InterviewMeetingProvider;

  @Column({ type: 'varchar', length: 300, nullable: true })
  location: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: InterviewBookingLinkStatus,
    default: InterviewBookingLinkStatus.OPEN,
  })
  status: InterviewBookingLinkStatus;

  @Column({ type: 'uuid', nullable: true })
  bookedInterviewId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  bookedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

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

  @ManyToOne(() => InterviewEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bookedInterviewId' })
  bookedInterview: InterviewEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity | null;
}
