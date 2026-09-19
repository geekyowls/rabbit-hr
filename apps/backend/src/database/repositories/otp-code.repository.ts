import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import {
  OtpCodeEntity,
  OtpPurpose,
  OtpTargetType,
} from '../entities/otp-code.entity';

@Injectable()
export class OtpCodeRepository extends Repository<OtpCodeEntity> {
  constructor(
    @InjectRepository(OtpCodeEntity)
    private readonly repository: Repository<OtpCodeEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findActive(
    target: string,
    purpose: OtpPurpose,
    organizationId: string,
  ): Promise<OtpCodeEntity | null> {
    return this.findOne({
      where: {
        target,
        purpose,
        organizationId,
        consumed: false,
        failed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async invalidateActive(
    target: string,
    purpose: OtpPurpose,
    organizationId: string,
  ): Promise<void> {
    await this.update(
      {
        target,
        purpose,
        organizationId,
        consumed: false,
        failed: false,
      },
      { consumed: true },
    );
  }

  async countSince(
    target: string,
    purpose: OtpPurpose,
    organizationId: string,
    since: Date,
  ): Promise<number> {
    return this.createQueryBuilder('otp')
      .where('otp.target = :target', { target })
      .andWhere('otp.purpose = :purpose', { purpose })
      .andWhere('otp.organizationId = :organizationId', { organizationId })
      .andWhere('otp.createdAt >= :since', { since })
      .getCount();
  }

  async findLatestForTarget(
    target: string,
    purpose: OtpPurpose,
    organizationId: string,
  ): Promise<OtpCodeEntity | null> {
    return this.findOne({
      where: { target, purpose, organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByResetToken(resetToken: string): Promise<OtpCodeEntity | null> {
    return this.findOne({
      where: {
        resetToken,
        resetTokenExpiresAt: MoreThan(new Date()),
      },
    });
  }

  async cleanupExpired(): Promise<void> {
    await this.delete({
      expiresAt: LessThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    });
  }

  buildTargetType(input: { email?: string; phone?: string }): {
    targetType: OtpTargetType;
    target: string;
  } {
    if (input.email) {
      return { targetType: 'email', target: input.email.toLowerCase().trim() };
    }
    if (input.phone) {
      return { targetType: 'phone', target: input.phone.trim() };
    }
    throw new Error('Either email or phone must be provided');
  }
}
