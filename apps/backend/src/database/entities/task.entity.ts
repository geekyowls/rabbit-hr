import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CandidateEntity } from './candidate.entity';
import { ApplicationEntity } from './application.entity';
import { JobEntity } from './job.entity';
import { ClientEntity } from './client.entity';
import { TaskStatus } from '../enums';

@Entity('tasks')
@Index(['organizationId', 'status', 'dueAt'])
@Index(['organizationId', 'assigneeId'])
export class TaskEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 250 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamp', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  assigneeId: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.OPEN })
  status: TaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  candidateId: string | null;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  jobId: string | null;

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: UserEntity | null;

  @ManyToOne(() => CandidateEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity | null;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: ApplicationEntity | null;

  @ManyToOne(() => JobEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'jobId' })
  job: JobEntity | null;

  @ManyToOne(() => ClientEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity | null;
}
