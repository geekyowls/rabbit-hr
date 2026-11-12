import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { numericTransformer } from '../numeric.transformer';
import { CandidateSource, RightToWork } from '../enums';
import type { CustomFieldValues } from './custom-field-definition.entity';

@Entity('candidates')
@Index(['organizationId', 'email'], { unique: true })
@Index(['organizationId', 'createdAt'])
export class CandidateEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  headline: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  currentTitle: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  currentEmployer: string | null;

  @Column({ type: 'int', nullable: true })
  yearsExperience: number | null;

  @Column({ type: 'text', array: true, default: '{}' })
  skills: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({
    type: 'enum',
    enum: CandidateSource,
    default: CandidateSource.OTHER,
  })
  source: CandidateSource;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cvFileKey: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cvFileName: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  linkedinUrl: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  expectedSalary: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  noticePeriod: string | null;

  @Column({ type: 'enum', enum: RightToWork, default: RightToWork.UNKNOWN })
  rightToWork: RightToWork;

  @Column({ type: 'timestamp', nullable: true })
  gdprConsentAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  customFields: CustomFieldValues;

  @Column({ type: 'timestamptz', nullable: true })
  portalInvitedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  portalLastLoginAt: Date | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity | null;
}
