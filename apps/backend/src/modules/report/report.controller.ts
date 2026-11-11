import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  ReportSummaryQueryDto,
  ReportSummaryResponseDto,
} from './dtos/report.dto';
import { GetReportSummary } from './usecases/get-report-summary/get-report-summary.usecase';
import { GetReportSummaryCommand } from './usecases/get-report-summary/get-report-summary.command';

@ApiTags('Reports')
@ApiCommonResponses()
@Controller('reports')
export class ReportController {
  constructor(private readonly getReportSummary: GetReportSummary) {}

  @Get('summary')
  @RequirePermissions(PERMISSIONS_ENUM.REPORT_READ)
  @ApiOperation({ summary: 'Recruitment report summary for a date range' })
  @ApiResponse(ReportSummaryResponseDto)
  async summary(
    @UserSession() user: UserSessionData,
    @Query() query: ReportSummaryQueryDto,
  ) {
    return this.getReportSummary.execute(
      GetReportSummaryCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        from: query.from,
        to: query.to,
        jobId: query.jobId,
        clientId: query.clientId,
        recruiterId: query.recruiterId,
      }),
    );
  }
}
