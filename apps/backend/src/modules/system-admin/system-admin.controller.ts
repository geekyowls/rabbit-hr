import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { ApiOkPaginatedResponse } from '@shared/decorators/api-ok-paginated-response.decorator';

import { SystemAdminGuard } from './guards/system-admin.guard';
import {
  ListOrganizationsDto,
  CreateOrganizationDto,
  UpdateOrganizationStatusDto,
  ResetLoginLockoutDto,
  SyncPermissionsDto,
} from './dtos';
import { ListOrganizations } from './usecases/list-organizations/list-organizations.usecase';
import { ListOrganizationsCommand } from './usecases/list-organizations/list-organizations.command';
import { CreateOrganization } from './usecases/create-organization/create-organization.usecase';
import { CreateOrganizationCommand } from './usecases/create-organization/create-organization.command';
import { UpdateOrganizationStatus } from './usecases/update-organization-status/update-organization-status.usecase';
import { UpdateOrganizationStatusCommand } from './usecases/update-organization-status/update-organization-status.command';
import { AccessOrganization } from './usecases/access-organization/access-organization.usecase';
import { AccessOrganizationCommand } from './usecases/access-organization/access-organization.command';
import { ResetLoginLockout } from './usecases/reset-login-lockout/reset-login-lockout.usecase';
import { ResetLoginLockoutCommand } from './usecases/reset-login-lockout/reset-login-lockout.command';
import { SyncRolePermissions } from './usecases/sync-role-permissions/sync-role-permissions.usecase';
import { SyncRolePermissionsCommand } from './usecases/sync-role-permissions/sync-role-permissions.command';

@ApiTags('System Admin')
@Controller('system-admin')
@ApiBearerAuth()
export class SystemAdminController {
  constructor(
    private readonly listOrganizations: ListOrganizations,
    private readonly createOrganization: CreateOrganization,
    private readonly updateOrganizationStatus: UpdateOrganizationStatus,
    private readonly accessOrganization: AccessOrganization,
    private readonly resetLoginLockoutUsecase: ResetLoginLockout,
    private readonly syncRolePermissionsUsecase: SyncRolePermissions,
  ) {}

  @Post('organizations/list')
  @UseGuards(SystemAdminGuard)
  @RequireAuthentication()
  @ApiOperation({ summary: 'List all organizations (paginated)' })
  @ApiOkPaginatedResponse(Object)
  async list(
    @UserSession() user: UserSessionData,
    @Body() dto: ListOrganizationsDto,
  ) {
    return this.listOrganizations.execute(
      ListOrganizationsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        limit: dto.limit,
        status: dto.status,
        subscriptionStatus: dto.subscriptionStatus,
        search: dto.search,
      }),
    );
  }

  @Post('organizations')
  @UseGuards(SystemAdminGuard)
  @RequireAuthentication()
  @ApiOperation({ summary: 'Create a new organization with admin user' })
  @ApiResponse({ status: 201 })
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.createOrganization.execute(
      CreateOrganizationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        name: dto.name,
        logo: dto.logo || undefined,
        adminEmail: dto.adminEmail,
        adminFirstName: dto.adminFirstName,
        adminLastName: dto.adminLastName,
        adminPassword: dto.adminPassword,
      }),
    );
  }

  @Patch('organizations/:id/status')
  @UseGuards(SystemAdminGuard)
  @RequireAuthentication()
  @ApiOperation({ summary: 'Update organization status' })
  @ApiResponse({ status: 200 })
  async updateStatus(
    @UserSession() user: UserSessionData,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationStatusDto,
  ) {
    return this.updateOrganizationStatus.execute(
      UpdateOrganizationStatusCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        targetOrganizationId: id,
        status: dto.status,
      }),
    );
  }

  @Post('organizations/:id/access')
  @UseGuards(SystemAdminGuard)
  @RequireAuthentication()
  @ApiOperation({
    summary: 'Generate access token for organization (opens in new tab)',
  })
  @ApiResponse({ status: 200 })
  async access(@UserSession() user: UserSessionData, @Param('id') id: string) {
    return this.accessOrganization.execute(
      AccessOrganizationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        targetOrganizationId: id,
      }),
    );
  }

  @Post('reset-login-lockout')
  @UseGuards(SystemAdminGuard)
  @RequireAuthentication()
  @ApiOperation({ summary: 'Reset login lockout for a user by email' })
  @ApiResponse({ status: 200 })
  async resetLoginLockout(
    @UserSession() user: UserSessionData,
    @Body() dto: ResetLoginLockoutDto,
  ) {
    return this.resetLoginLockoutUsecase.execute(
      ResetLoginLockoutCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        email: dto.email,
      }),
    );
  }

  @Post('sync-permissions')
  @UseGuards(SystemAdminGuard)
  @RequireAuthentication()
  @ApiOperation({
    summary: 'Sync ALL_PERMISSIONS to default admin roles across organizations',
  })
  @ApiResponse({ status: 200 })
  async syncPermissions(
    @UserSession() user: UserSessionData,
    @Body() dto: SyncPermissionsDto,
  ) {
    return this.syncRolePermissionsUsecase.execute(
      SyncRolePermissionsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        targetOrganizationId: dto.organizationId,
      }),
    );
  }
}
