import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { UpdateOrganizationDto } from './dtos/update-organization.dto';
import { OrganizationResponseDto } from './dtos/organization-response.dto';
import {
  GetOrganization,
  GetOrganizationCommand,
} from './usecases/get-organization';
import {
  UpdateOrganization,
  UpdateOrganizationCommand,
} from './usecases/update-organization';

@ApiTags('Organization')
@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly getOrganization: GetOrganization,
    private readonly updateOrganization: UpdateOrganization,
  ) {}

  @Get()
  @RequireAuthentication()
  @ApiOperation({ summary: 'Get current organization details' })
  @ApiResponse(OrganizationResponseDto)
  @ApiCommonResponses()
  async get(
    @UserSession() user: UserSessionData,
  ): Promise<OrganizationResponseDto> {
    return this.getOrganization.execute(
      GetOrganizationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Put()
  @RequirePermissions(PERMISSIONS_ENUM.ORGANIZATION_UPDATE)
  @ApiOperation({ summary: 'Update organization details' })
  @ApiResponse(OrganizationResponseDto)
  @ApiCommonResponses()
  async update(
    @UserSession() user: UserSessionData,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.updateOrganization.execute(
      UpdateOrganizationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        name: dto.name,
        logo: dto.logo,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        address: dto.address,
        pdfTemplate: dto.pdfTemplate,
        privacyPolicyUrl: dto.privacyPolicyUrl,
        termsAndConditionsUrl: dto.termsAndConditionsUrl,
        showGoogleLogin: dto.showGoogleLogin,
        showAppleLogin: dto.showAppleLogin,
        hideDietitianName: dto.hideDietitianName,
        reEngagementEmailsEnabled: dto.reEngagementEmailsEnabled,
        dailyDigestEnabled: dto.dailyDigestEnabled,
        invoiceSettings: dto.invoiceSettings,
      }),
    );
  }
}
