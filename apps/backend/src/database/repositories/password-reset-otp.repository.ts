import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, IsNull } from 'typeorm';
import { PasswordResetOtpEntity } from '../entities/password-reset-otp.entity';

@Injectable()
export class PasswordResetOtpRepository extends Repository<PasswordResetOtpEntity> {
  constructor(
    @InjectRepository(PasswordResetOtpEntity)
    private readonly repository: Repository<PasswordResetOtpEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByEmailAndOrg(
    email: string,
    organizationId: string,
  ): Promise<PasswordResetOtpEntity | null> {
    return this.findOne({
      where: {
        email: email.toLowerCase().trim(),
        organizationId,
        used: false,
        resetToken: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByResetToken(
    resetToken: string,
  ): Promise<PasswordResetOtpEntity | null> {
    return this.findOne({
      where: {
        resetToken,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async cleanupExpired(): Promise<void> {
    await this.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
