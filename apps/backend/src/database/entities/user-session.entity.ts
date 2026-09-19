import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('user_sessions')
@Index(['userId'])
@Index(['userId', 'revokedAt'])
@Index(['jti'], { unique: true })
export class UserSessionEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  jti!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUsedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revokedAt!: Date | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;
}
