import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogRepository } from '@db/repositories';
import { AuditLogEntity } from '@db/entities';

@Injectable()
export class GetAuditLog {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(id: string, organizationId: string): Promise<AuditLogEntity> {
    const auditLog = await this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoin('audit.actor', 'actor')
      .where('audit.id = :id', { id })
      .andWhere('audit.organizationId = :organizationId', { organizationId })
      .select([
        'audit.id',
        'audit.organizationId',
        'audit.actorId',
        'audit.method',
        'audit.path',
        'audit.action',
        'audit.statusCode',
        'audit.metadata',
        'audit.ipAddress',
        'audit.userAgent',
        'audit.duration',
        'audit.createdAt',
        'actor.id',
        'actor.firstName',
        'actor.lastName',
        'actor.email',
      ])
      .getOne();

    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    return auditLog;
  }
}
