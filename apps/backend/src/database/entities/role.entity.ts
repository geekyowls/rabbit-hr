import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('roles')
@Index(['name', 'organizationId'], { unique: true })
export class RoleEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'jsonb', default: [] })
  permissions!: string[];

  @Column({ type: 'uuid', nullable: false })
  organizationId!: string;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;
}
