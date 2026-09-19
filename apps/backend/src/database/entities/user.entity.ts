import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { OrganizationEntity } from './organization.entity';
import { RoleEntity } from './role.entity';
import { BaseEntity } from './base.entity';
import { UserStatus } from '../enums';

@Entity('users')
@Index(['email', 'organizationId'], { unique: true })
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  email!: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true, default: 'IN' })
  phoneCountryCode!: string | null;

  @Column({ type: 'uuid', nullable: false })
  organizationId!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INVITED,
  })
  status!: UserStatus;

  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  onboarded!: boolean;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordResetToken!: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true, select: false })
  passwordResetExpires!: Date | null;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  inviteToken!: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true, select: false })
  inviteExpires!: Date | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true, select: false })
  refreshToken!: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true, select: false })
  refreshTokenExpires!: Date | null;

  @Exclude()
  @Column({ type: 'uuid', nullable: true, select: false })
  refreshTokenJti!: string | null;

  @Column({ type: 'uuid', nullable: true })
  invitedBy!: string | null;

  @ManyToOne(() => OrganizationEntity, (org) => org.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'uuid', nullable: true })
  roleId!: string | null;

  @ManyToOne(() => RoleEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'roleId' })
  role!: RoleEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'invitedBy' })
  inviter!: UserEntity | null;

  @Column({ type: 'boolean', default: false })
  tourCompleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastReEngagementEmailAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  managerId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.directReports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'managerId' })
  manager!: UserEntity | null;

  @OneToMany(() => UserEntity, (user) => user.manager)
  directReports!: UserEntity[];

  @Column({ type: 'varchar', length: 1000, nullable: true })
  path!: string | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  metadata!: Record<string, unknown> | null;
}
