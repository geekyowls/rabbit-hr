import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';

import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiOkPaginatedResponse } from '@shared/decorators/api-ok-paginated-response.decorator';
import { PaginatedResponseDto } from '@shared/dtos/pagination-response';
import { AuditLogResponseDto } from './dtos/audit-log-response.dto';
import { ListAuditLogsDto } from './dtos/list-audit-logs.dto';
import { ListAuditLogs } from './usecases/list-audit-logs/list-audit-logs.usecase';
import { ListAuditLogsCommand } from './usecases/list-audit-logs/list-audit-logs.command';
import { GetAuditLog } from './usecases/get-audit-log/get-audit-log.usecase';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(
    private readonly listAuditLogs: ListAuditLogs,
    private readonly getAuditLog: GetAuditLog,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.AUDIT_LIST_READ)
  @ApiOperation({ summary: 'List audit logs with pagination and filters' })
  @ApiOkPaginatedResponse(AuditLogResponseDto)
  async list(
    @UserSession() user: UserSessionData,
    @Body() dto: ListAuditLogsDto,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>> {
    return this.listAuditLogs.execute(
      ListAuditLogsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        actorId: dto.actorId,
        action: dto.action,
        method: dto.method,
        startDate: dto.startDate,
        endDate: dto.endDate,
      }),
    ) as any;
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS_ENUM.AUDIT_READ)
  @ApiOperation({ summary: 'Get a single audit log by ID' })
  @ApiResponse({ status: 200, type: AuditLogResponseDto })
  async get(
    @UserSession() user: UserSessionData,
    @Param('id') id: string,
  ): Promise<AuditLogResponseDto> {
    return this.getAuditLog.execute(id, user.organizationId) as any;
  }
}
