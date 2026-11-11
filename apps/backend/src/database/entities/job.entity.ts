import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { ClientEntity } from './client.entity';
import { numericTransformer } from '../numeric.transformer';
import { EmploymentType, JobStatus, RateUnit, WorkMode } from '../enums';

export interface ScreeningQuestion {
  id: string;
  question: string;
  required: boolean;
}

@Entity('jobs')
@Index(['organizationId', 'reference'], { unique: true })
@Index(['organizationId', 'status'])
@Index(['organizationId', 'clientId'])
export class JobEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 20 })
  reference: string;

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.PERMANENT,
  })
  employmentType: EmploymentType;

  @Column({ type: 'enum', enum: WorkMode, default: WorkMode.ONSITE })
  workMode: WorkMode;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  salaryMin: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  salaryMax: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  payRate: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  chargeRate: number | null;

  @Column({ type: 'enum', enum: RateUnit, nullable: true })
  rateUnit: RateUnit | null;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'int', default: 1 })
  openings: number;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ type: 'date', nullable: true })
  closingDate: string | null;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'text', array: true, default: '{}' })
  skills: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  screeningQuestions: ScreeningQuestion[];

  @Column({ type: 'text', array: true, default: '{}' })
  requiredDocuments: string[];

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => ClientEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity | null;
}
