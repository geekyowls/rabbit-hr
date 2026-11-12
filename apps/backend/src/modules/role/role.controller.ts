import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  PERMISSIONS_ENUM,
  PERMISSION_BASE,
  PlanFeature,
} from '@boilerplate/core';

import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import {
  RequirePermissions,
  RequireAnyPermission,
} from '@shared/decorators/require-permissions.decorator';
import { RequirePlanFeature } from '@shared/decorators/require-plan-feature.decorator';
import { RoleResponseDto } from './dtos/role-response.dto';
import { RoleDropdownDto } from './dtos/role-dropdown.dto';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { CreateRole } from './usecases/create-role/create-role.usecase';
import { CreateRoleCommand } from './usecases/create-role/create-role.command';
import { UpdateRole } from './usecases/update-role/update-role.usecase';
import { UpdateRoleCommand } from './usecases/update-role/update-role.command';
import { ListRoles } from './usecases/list-roles/list-roles.usecase';
import { ListRolesCommand } from './usecases/list-roles/list-roles.command';
import { ListRolesDropdown } from './usecases/list-roles-dropdown/list-roles-dropdown.usecase';
import { ListRolesDropdownCommand } from './usecases/list-roles-dropdown/list-roles-dropdown.command';
import { GetRole } from './usecases/get-role/get-role.usecase';
import { DeleteRole } from './usecases/delete-role/delete-role.usecase';
import { DeleteRoleCommand } from './usecases/delete-role/delete-role.command';

@ApiTags('Roles')
@Controller('roles')
export class RoleController {
  constructor(
    private readonly createRole: CreateRole,
    private readonly updateRole: UpdateRole,
    private readonly listRoles: ListRoles,
    private readonly listRolesDropdown: ListRolesDropdown,
    private readonly getRole: GetRole,
    private readonly deleteRole: DeleteRole,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS_ENUM.ROLE_CREATE)
  @RequirePlanFeature(PlanFeature.CUSTOM_ROLES)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.createRole.execute(
      CreateRoleCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        name: dto.name,
        permissions: dto.permissions,
      }),
    );
  }

  @Get()
  @RequireAnyPermission(
    PERMISSIONS_ENUM.ROLE_LIST_READ,
    PERMISSIONS_ENUM.USER_CREATE,
    PERMISSION_BASE.USER_UPDATE,
  )
  @ApiOperation({ summary: 'List roles for dropdown (id and name only)' })
  @ApiResponse({ status: 200, type: [RoleDropdownDto] })
  async list(@UserSession() user: UserSessionData): Promise<RoleDropdownDto[]> {
    return this.listRolesDropdown.execute(
      ListRolesDropdownCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS_ENUM.ROLE_LIST_READ)
  @ApiOperation({
    summary: 'List all roles in the organization with full data',
  })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  async listFull(
    @UserSession() user: UserSessionData,
  ): Promise<RoleResponseDto[]> {
    return this.listRoles.execute(
      ListRolesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS_ENUM.ROLE_READ)
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async get(
    @UserSession() user: UserSessionData,
    @Param('id') roleId: string,
  ): Promise<RoleResponseDto> {
    return this.getRole.execute(roleId, user.organizationId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS_ENUM.ROLE_UPDATE)
  @RequirePlanFeature(PlanFeature.CUSTOM_ROLES)
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async update(
    @UserSession() user: UserSessionData,
    @Param('id') roleId: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.updateRole.execute(
      UpdateRoleCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        roleId,
        name: dto.name,
        permissions: dto.permissions,
      }),
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS_ENUM.ROLE_UPDATE)
  @RequirePlanFeature(PlanFeature.CUSTOM_ROLES)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200 })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id') roleId: string,
  ): Promise<void> {
    return this.deleteRole.execute(
      DeleteRoleCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        roleId,
      }),
    );
  }
}
