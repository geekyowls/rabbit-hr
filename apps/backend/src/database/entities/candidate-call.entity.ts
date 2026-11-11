import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CandidateEntity } from './candidate.entity';
import { ApplicationEntity } from './application.entity';
import { CallDirection, CallDisposition, CallStatus } from '../enums';

@Entity('candidate_calls')
@Index(['organizationId', 'candidateId', 'createdAt'])
@Index(['organizationId', 'createdAt'])
export class CandidateCallEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 30, default: 'plivo' })
  provider: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  requestUuid: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  callUuid: string | null;

  @Column({
    type: 'enum',
    enum: CallDirection,
    default: CallDirection.OUTBOUND,
  })
  direction: CallDirection;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.INITIATED })
  status: CallStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hangupCause: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  fromNumber: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  toNumber: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  staffNumber: string | null;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ type: 'int', nullable: true })
  billDurationSeconds: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'enum', enum: CallDisposition, nullable: true })
  disposition: CallDisposition | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  recordingUrl: string | null;

  @Column({ type: 'int', nullable: true })
  recordingDurationSeconds: number | null;

  @Column({ type: 'uuid', nullable: true })
  activityId: string | null;

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
  @JoinColumn({ name: 'actorId' })
  actor: UserEntity | null;
}
