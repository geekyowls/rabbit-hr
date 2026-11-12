import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

export type WhatsappVariableSource =
  { type: 'placeholder'; key: string } | { type: 'text'; value: string };

@Entity('whatsapp_templates')
@Index(['organizationId', 'provider', 'name', 'language'], { unique: true })
export class WhatsappTemplateEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: '' })
  language: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string | null;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  variableKeys: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  mapping: Record<string, WhatsappVariableSource>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string | null;

  @Column({ type: 'boolean', default: true })
  availableAtProvider: boolean;

  @Column({ type: 'boolean', default: false })
  addedManually: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  unsupportedReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;
}
