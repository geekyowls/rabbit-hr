import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('password_reset_otps')
@Index(['email', 'organizationId'])
@Index(['resetToken'])
export class PasswordResetOtpEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 6 })
  otp!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetToken!: string | null;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;
}
