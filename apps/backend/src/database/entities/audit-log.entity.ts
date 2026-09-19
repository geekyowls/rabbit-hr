import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
@Index(['organizationId', 'createdAt'])
@Index(['actorId'])
@Index(['action'])
export class AuditLogEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'uuid', nullable: true })
  impersonatedBy: string | null;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar', length: 255 })
  path: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'actorId' })
  actor: UserEntity | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'impersonatedBy' })
  impersonator: UserEntity | null;
}
