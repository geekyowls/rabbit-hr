import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { ListAuditLogs } from './usecases/list-audit-logs/list-audit-logs.usecase';
import { GetAuditLog } from './usecases/get-audit-log/get-audit-log.usecase';

const USE_CASES = [ListAuditLogs, GetAuditLog];

@Module({
  controllers: [AuditController],
  providers: [...USE_CASES],
})
export class AuditModule {}
