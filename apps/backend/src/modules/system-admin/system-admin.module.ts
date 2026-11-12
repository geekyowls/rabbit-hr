import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';

import { SystemAdminController } from './system-admin.controller';
import { SystemAdminGuard } from './guards/system-admin.guard';
import { ListOrganizations } from './usecases/list-organizations/list-organizations.usecase';
import { CreateOrganization } from './usecases/create-organization/create-organization.usecase';
import { UpdateOrganizationStatus } from './usecases/update-organization-status/update-organization-status.usecase';
import { UpdateOrganizationBilling } from './usecases/update-organization-billing/update-organization-billing.usecase';
import { AccessOrganization } from './usecases/access-organization/access-organization.usecase';
import { ResetLoginLockout } from './usecases/reset-login-lockout/reset-login-lockout.usecase';
import { SyncRolePermissions } from './usecases/sync-role-permissions/sync-role-permissions.usecase';

const USE_CASES = [
  ListOrganizations,
  CreateOrganization,
  UpdateOrganizationStatus,
  UpdateOrganizationBilling,
  AccessOrganization,
  ResetLoginLockout,
  SyncRolePermissions,
];

@Module({
  imports: [AuthModule],
  controllers: [SystemAdminController],
  providers: [SystemAdminGuard, ...USE_CASES],
})
export class SystemAdminModule {}
