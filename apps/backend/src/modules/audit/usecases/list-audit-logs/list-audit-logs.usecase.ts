import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import { AuditLogRepository } from '@db/repositories';
import { ListAuditLogsCommand } from './list-audit-logs.command';

@Injectable()
export class ListAuditLogs {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(command: ListAuditLogsCommand) {
    const skip = calculateSkip(command.page, command.limit);

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoin('audit.actor', 'actor')
      .where('audit.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
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
      ]);

    if (command.actorId) {
      queryBuilder.andWhere('audit.actorId = :actorId', {
        actorId: command.actorId,
      });
    }

    if (command.action) {
      queryBuilder.andWhere('audit.action ILIKE :action', {
        action: `%${command.action}%`,
      });
    }

    if (command.method) {
      queryBuilder.andWhere('audit.method = :method', {
        method: command.method,
      });
    }

    if (command.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', {
        startDate: command.startDate,
      });
    }

    if (command.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', {
        endDate: command.endDate,
      });
    }

    queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(command.limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      data: logs,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
