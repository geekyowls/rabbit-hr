import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
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
  OnboardingChecklistDto,
  SampleDataResultDto,
} from './dtos/onboarding.dto';
import { OnboardingCommand } from './usecases/onboarding.command';
import { GetOnboardingChecklist } from './usecases/get-onboarding-checklist/get-onboarding-checklist.usecase';
import { DismissOnboarding } from './usecases/dismiss-onboarding/dismiss-onboarding.usecase';
import { AddSampleData } from './usecases/add-sample-data/add-sample-data.usecase';
import { RemoveSampleData } from './usecases/remove-sample-data/remove-sample-data.usecase';

@ApiTags('Onboarding')
@ApiCommonResponses()
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly getChecklist: GetOnboardingChecklist,
    private readonly dismissOnboarding: DismissOnboarding,
    private readonly addSampleData: AddSampleData,
    private readonly removeSampleData: RemoveSampleData,
  ) {}

  private command(user: UserSessionData) {
    return OnboardingCommand.create({
      userId: user.userId,
      organizationId: user.organizationId,
    });
  }

  @Get('checklist')
  @RequirePermissions(PERMISSIONS_ENUM.ORGANIZATION_UPDATE)
  @ApiOperation({ summary: 'Get the first-run setup checklist' })
  @ApiResponse(OnboardingChecklistDto)
  async checklist(@UserSession() user: UserSessionData) {
    return this.getChecklist.execute(this.command(user));
  }

  @Post('dismiss')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.ORGANIZATION_UPDATE)
  @ApiOperation({ summary: 'Hide the setup checklist for the organization' })
  @ApiResponse(OnboardingChecklistDto)
  async dismiss(@UserSession() user: UserSessionData) {
    return this.dismissOnboarding.execute(this.command(user));
  }

  @Post('sample-data')
  @RequirePermissions(PERMISSIONS_ENUM.ORGANIZATION_UPDATE)
  @ApiOperation({ summary: 'Add a small labelled sample dataset' })
  @ApiResponse(SampleDataResultDto)
  async addSample(@UserSession() user: UserSessionData) {
    return this.addSampleData.execute(this.command(user));
  }

  @Delete('sample-data')
  @RequirePermissions(PERMISSIONS_ENUM.ORGANIZATION_UPDATE)
  @ApiOperation({ summary: 'Remove the sample dataset' })
  @ApiResponse(SampleDataResultDto)
  async removeSample(@UserSession() user: UserSessionData) {
    return this.removeSampleData.execute(this.command(user));
  }
}
