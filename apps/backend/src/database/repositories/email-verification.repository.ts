import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EmailVerificationEntity } from '../entities/email-verification.entity';

@Injectable()
export class EmailVerificationRepository extends Repository<EmailVerificationEntity> {
  constructor(
    @InjectRepository(EmailVerificationEntity)
    private readonly repository: Repository<EmailVerificationEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByEmail(email: string): Promise<EmailVerificationEntity | null> {
    return this.findOne({ where: { email: email.toLowerCase() } });
  }

  async upsertByEmail(
    email: string,
    data: Partial<EmailVerificationEntity>,
  ): Promise<EmailVerificationEntity> {
    const existing = await this.findByEmail(email);
    if (existing) {
      Object.assign(existing, data);
      return this.save(existing);
    }
    const entity = this.create({ email: email.toLowerCase(), ...data });
    return this.save(entity);
  }
}
