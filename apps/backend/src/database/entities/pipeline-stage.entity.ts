import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { PipelineStageCategory } from '../enums';

@Entity('pipeline_stages')
@Index(['organizationId', 'key'], { unique: true })
@Index(['organizationId', 'order'])
export class PipelineStageEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'enum', enum: PipelineStageCategory })
  category: PipelineStageCategory;

  @Column({ type: 'varchar', length: 32, default: 'slate' })
  color: string;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;
}
