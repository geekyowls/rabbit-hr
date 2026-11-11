import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import { CreateConfigDto } from './dtos/create-config.dto';
import { ConfigResponseDto } from './dtos/config-response.dto';
import { CreateConfig } from './usecases/create-config/create-config.usecase';
import { CreateConfigCommand } from './usecases/create-config/create-config.command';

@ApiTags('Organization Config')
@Controller('organization-config')
export class OrganizationConfigController {
  constructor(private readonly createConfig: CreateConfig) {}

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.ORGANIZATION_SETTINGS)
  @ApiOperation({
    summary: 'Create organization config item (tag, template, etc.)',
  })
  @ApiResponse({ status: 201, type: ConfigResponseDto })
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateConfigDto,
  ): Promise<ConfigResponseDto> {
    return this.createConfig.execute(
      CreateConfigCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        type: dto.type,
        name: dto.name,
        value: dto.value,
      }),
    );
  }
}
