import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import {
  RequireAnyPermission,
  RequirePermissions,
} from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { ATS_READ_PERMISSIONS } from '@shared/constants';
import {
  PipelineStageResponseDto,
  ReplacePipelineStagesDto,
} from './dtos/pipeline-stage.dto';
import { ListPipelineStages } from './usecases/list-pipeline-stages/list-pipeline-stages.usecase';
import { ListPipelineStagesCommand } from './usecases/list-pipeline-stages/list-pipeline-stages.command';
import { ReplacePipelineStages } from './usecases/replace-pipeline-stages/replace-pipeline-stages.usecase';
import { ReplacePipelineStagesCommand } from './usecases/replace-pipeline-stages/replace-pipeline-stages.command';

@ApiTags('Pipeline Stages')
@ApiCommonResponses()
@Controller('pipeline-stages')
export class PipelineStageController {
  constructor(
    private readonly listPipelineStages: ListPipelineStages,
    private readonly replacePipelineStages: ReplacePipelineStages,
  ) {}

  @Get()
  @RequireAnyPermission(
    ...ATS_READ_PERMISSIONS,
    PERMISSIONS_ENUM.PIPELINE_STAGE_MANAGE,
  )
  @ApiOperation({ summary: 'List the organization pipeline stages in order' })
  @ApiResponse(PipelineStageResponseDto, 200, true)
  async list(@UserSession() user: UserSessionData) {
    return this.listPipelineStages.execute(
      ListPipelineStagesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Put()
  @RequirePermissions(PERMISSIONS_ENUM.PIPELINE_STAGE_MANAGE)
  @ApiOperation({ summary: 'Replace the ordered list of pipeline stages' })
  @ApiResponse(PipelineStageResponseDto, 200, true)
  async replace(
    @UserSession() user: UserSessionData,
    @Body() dto: ReplacePipelineStagesDto,
  ) {
    return this.replacePipelineStages.execute(
      ReplacePipelineStagesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        payload: dto,
      }),
    );
  }
}
