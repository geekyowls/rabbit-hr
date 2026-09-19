import { Entity, Column, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from './base.entity';

export type OtpTargetType = 'email' | 'phone';
export type OtpPurpose = 'login' | 'signup' | 'forgot_password';

@Entity('otp_codes')
@Index(['target', 'purpose', 'organizationId'])
@Index(['resetToken'])
export class OtpCodeEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 16 })
  targetType!: OtpTargetType;

  @Column({ type: 'varchar', length: 255 })
  target!: string;

  @Column({ type: 'varchar', length: 32 })
  purpose!: OtpPurpose;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Exclude()
  @Column({ type: 'varchar', length: 128 })
  codeHash!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'boolean', default: false })
  consumed!: boolean;

  @Column({ type: 'boolean', default: false })
  failed!: boolean;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  resetToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiresAt!: Date | null;
}
