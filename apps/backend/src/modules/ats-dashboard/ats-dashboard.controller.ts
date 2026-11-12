import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { AtsDashboardResponseDto } from './dtos/ats-dashboard.dto';
import { GetAtsDashboard } from './usecases/get-ats-dashboard/get-ats-dashboard.usecase';
import { GetAtsDashboardCommand } from './usecases/get-ats-dashboard/get-ats-dashboard.command';

@ApiTags('ATS Dashboard')
@ApiCommonResponses()
@Controller('ats')
export class AtsDashboardController {
  constructor(private readonly getAtsDashboard: GetAtsDashboard) {}

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS_ENUM.ATS_DASHBOARD_READ)
  @ApiOperation({ summary: 'Recruitment dashboard metrics' })
  @ApiResponse(AtsDashboardResponseDto)
  async dashboard(@UserSession() user: UserSessionData) {
    return this.getAtsDashboard.execute(
      GetAtsDashboardCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }
}
