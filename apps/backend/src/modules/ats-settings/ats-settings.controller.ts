import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  AtsSettingsResponseDto,
  UpdateAtsSettingsDto,
} from './dtos/ats-settings.dto';
import { GetAtsSettings } from './usecases/get-ats-settings/get-ats-settings.usecase';
import { GetAtsSettingsCommand } from './usecases/get-ats-settings/get-ats-settings.command';
import { UpdateAtsSettings } from './usecases/update-ats-settings/update-ats-settings.usecase';
import { UpdateAtsSettingsCommand } from './usecases/update-ats-settings/update-ats-settings.command';

@ApiTags('ATS Settings')
@ApiCommonResponses()
@Controller('ats-settings')
export class AtsSettingsController {
  constructor(
    private readonly getAtsSettings: GetAtsSettings,
    private readonly updateAtsSettings: UpdateAtsSettings,
  ) {}

  @Get()
  @RequireAuthentication()
  @ApiOperation({ summary: 'Get organization ATS settings' })
  @ApiResponse(AtsSettingsResponseDto)
  async get(@UserSession() user: UserSessionData) {
    return this.getAtsSettings.execute(
      GetAtsSettingsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Put()
  @RequirePermissions(PERMISSIONS_ENUM.ATS_SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Update organization ATS settings' })
  @ApiResponse(AtsSettingsResponseDto)
  async update(
    @UserSession() user: UserSessionData,
    @Body() dto: UpdateAtsSettingsDto,
  ) {
    return this.updateAtsSettings.execute(
      UpdateAtsSettingsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }
}
