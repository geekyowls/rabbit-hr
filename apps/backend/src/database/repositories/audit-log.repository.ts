import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository extends Repository<AuditLogEntity> {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
