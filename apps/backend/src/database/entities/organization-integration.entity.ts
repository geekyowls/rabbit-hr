import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { SupportedIntegrationEntity } from './supported-integration.entity';
import { OrganizationIntegrationStatus } from '../enums';

@Entity('organization_integrations')
@Index(['organizationId', 'supportedIntegrationId'], { unique: true })
export class OrganizationIntegrationEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  organizationId!: string;

  @Column({ type: 'uuid', nullable: false })
  supportedIntegrationId!: string;

  @Column({
    type: 'enum',
    enum: OrganizationIntegrationStatus,
    default: OrganizationIntegrationStatus.CONNECTED,
  })
  status!: OrganizationIntegrationStatus;

  @Column({ type: 'text', nullable: false })
  encryptedTokens!: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt!: Date | null;

  @Column({ type: 'uuid', nullable: false })
  connectedBy!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  accountEmail!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  accountName!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  webhookToken!: string | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @ManyToOne(() => SupportedIntegrationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supportedIntegrationId' })
  supportedIntegration!: SupportedIntegrationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'connectedBy' })
  connector!: UserEntity | null;
}
