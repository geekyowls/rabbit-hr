import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { CustomFieldEntityType, CustomFieldType } from '../enums';

export type CustomFieldValue = string | number | boolean | string[] | null;

export type CustomFieldValues = Record<string, CustomFieldValue>;

@Entity('custom_field_definitions')
@Index(['organizationId', 'entity', 'key'], { unique: true })
@Index(['organizationId', 'entity', 'order'])
export class CustomFieldDefinitionEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'enum', enum: CustomFieldEntityType })
  entity: CustomFieldEntityType;

  @Column({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ type: 'enum', enum: CustomFieldType })
  type: CustomFieldType;

  @Column({ type: 'text', array: true, default: '{}' })
  options: string[];

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  showOnCareersForm: boolean;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;
}
