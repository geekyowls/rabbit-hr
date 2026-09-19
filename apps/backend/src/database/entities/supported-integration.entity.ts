import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { IntegrationCategory, IntegrationAuthType } from '../enums';

@Entity('supported_integrations')
@Index(['provider'], { unique: true })
export class SupportedIntegrationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: false })
  provider!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  iconUrl!: string | null;

  @Column({
    type: 'enum',
    enum: IntegrationCategory,
    default: IntegrationCategory.PRODUCTIVITY,
  })
  category!: IntegrationCategory;

  @Column({
    type: 'enum',
    enum: IntegrationAuthType,
    default: IntegrationAuthType.OAUTH,
  })
  authType!: IntegrationAuthType;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
