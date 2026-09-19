import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity('email_verifications')
@Index(['email'], { unique: true })
export class EmailVerificationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 10 })
  otpCode!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'int', default: 0 })
  attempts!: number;
}
