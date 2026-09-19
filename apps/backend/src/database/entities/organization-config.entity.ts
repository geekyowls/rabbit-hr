import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { OrganizationConfigType } from '../enums';

@Entity('organization_configs')
@Index(['organizationId', 'type', 'name'], { unique: true })
@Index(['organizationId', 'type'])
export class OrganizationConfigEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  organizationId!: string;

  @Column({
    type: 'enum',
    enum: OrganizationConfigType,
    nullable: false,
  })
  type!: OrganizationConfigType;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  value!: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;
}
