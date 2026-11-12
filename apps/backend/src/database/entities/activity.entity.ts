import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CandidateEntity } from './candidate.entity';
import { ApplicationEntity } from './application.entity';
import { JobEntity } from './job.entity';
import { ClientEntity } from './client.entity';
import { ActivityType } from '../enums';

@Entity('activities')
@Index(['organizationId', 'createdAt'])
@Index(['organizationId', 'candidateId'])
@Index(['organizationId', 'applicationId'])
@Index(['organizationId', 'jobId'])
@Index(['organizationId', 'clientId'])
export class ActivityEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  candidateId: string | null;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  jobId: string | null;

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'varchar', length: 250 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => CandidateEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'candidateId' })
  candidate: CandidateEntity | null;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: ApplicationEntity | null;

  @ManyToOne(() => JobEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'jobId' })
  job: JobEntity | null;

  @ManyToOne(() => ClientEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor: UserEntity | null;
}
