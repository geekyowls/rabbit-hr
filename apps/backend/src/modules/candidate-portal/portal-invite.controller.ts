import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM, PlanFeature } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePlanFeature } from '@shared/decorators/require-plan-feature.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { PortalInviteResponseDto } from './dtos/portal.dto';
import { InviteCandidateToPortal } from './usecases/invite-candidate-to-portal/invite-candidate-to-portal.usecase';
import { InviteCandidateToPortalCommand } from './usecases/invite-candidate-to-portal/invite-candidate-to-portal.command';

@ApiTags('Candidate Portal')
@ApiCommonResponses()
@Controller('candidates')
export class PortalInviteController {
  constructor(
    private readonly inviteCandidateToPortal: InviteCandidateToPortal,
  ) {}

  @Post(':id/portal-invite')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.CANDIDATE_UPDATE)
  @RequirePlanFeature(PlanFeature.CANDIDATE_PORTAL)
  @ApiOperation({ summary: 'Email a candidate a link to the candidate portal' })
  @ApiResponse(PortalInviteResponseDto)
  async invite(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inviteCandidateToPortal.execute(
      InviteCandidateToPortalCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId: id,
      }),
    );
  }
}
