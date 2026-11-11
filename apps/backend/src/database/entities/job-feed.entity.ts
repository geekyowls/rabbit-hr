import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('job_feeds')
@Index(['organizationId'], { unique: true })
export class JobFeedEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token: string;

  @Column({ type: 'boolean', default: true })
  includeClientNames: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastAccessedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;
}
