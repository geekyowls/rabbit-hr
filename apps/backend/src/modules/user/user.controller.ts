import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { PERMISSIONS_ENUM, PERMISSION_BASE } from '@boilerplate/core';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import {
  RequirePermissions,
  RequireAnyPermission,
} from '@shared/decorators/require-permissions.decorator';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { ApiOkPaginatedResponse } from '@shared/decorators/api-ok-paginated-response.decorator';
import { PaginatedResponseDto } from '@shared/dtos/pagination-response';

import { InviteUserDto } from './dtos/invite-user.dto';
import { AcceptInviteDto } from './dtos/accept-invite.dto';
import { ResendInviteDto } from './dtos/resend-invite.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ListUsersDto } from './dtos/list-users.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { InviteResponseDto } from './dtos/invite-response.dto';
import { SetManagerDto } from './dtos/set-manager.dto';
import { InviteUser } from './usecases/invite-user/invite-user.usecase';
import { InviteUserCommand } from './usecases/invite-user/invite-user.command';
import { AcceptInvite } from './usecases/accept-invite/accept-invite.usecase';
import { AcceptInviteCommand } from './usecases/accept-invite/accept-invite.command';
import { ResendInvite } from './usecases/resend-invite/resend-invite.usecase';
import { ResendInviteCommand } from './usecases/resend-invite/resend-invite.command';
import { BlockUser } from './usecases/block-user/block-user.usecase';
import { BlockUserCommand } from './usecases/block-user/block-user.command';
import { UnblockUser } from './usecases/unblock-user/unblock-user.usecase';
import { UnblockUserCommand } from './usecases/unblock-user/unblock-user.command';
import { UpdateUser } from './usecases/update-user/update-user.usecase';
import { UpdateUserCommand } from './usecases/update-user/update-user.command';
import { GetCurrentUser } from './usecases/get-current-user/get-current-user.usecase';
import { ListUsers } from './usecases/list-users/list-users.usecase';
import { ListUsersCommand } from './usecases/list-users/list-users.command';
import { ListUsersDropdown } from './usecases/list-users-dropdown/list-users-dropdown.usecase';
import { ListUsersDropdownCommand } from './usecases/list-users-dropdown/list-users-dropdown.command';
import { UserDropdownDto } from './dtos/user-dropdown.dto';
import { UpdateProfile } from './usecases/update-profile/update-profile.usecase';
import { UpdateProfileCommand } from './usecases/update-profile/update-profile.command';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { CreateUser } from './usecases/create-user/create-user.usecase';
import { CreateUserCommand } from './usecases/create-user/create-user.command';
import { CreateUserDto } from './dtos/create-user.dto';
import { CompleteTour } from './usecases/complete-tour/complete-tour.usecase';
import { CompleteTourCommand } from './usecases/complete-tour/complete-tour.command';
import { SetManager } from './usecases/set-manager/set-manager.usecase';
import { SetManagerCommand } from './usecases/set-manager/set-manager.command';
import { GetUserHierarchy } from './usecases/get-user-hierarchy/get-user-hierarchy.usecase';
import { GetUserHierarchyCommand } from './usecases/get-user-hierarchy/get-user-hierarchy.command';
import { GetUserDescendants } from './usecases/get-user-descendants/get-user-descendants.usecase';
import { GetUserDescendantsCommand } from './usecases/get-user-descendants/get-user-descendants.command';
import { AdminResetPassword } from './usecases/admin-reset-password/admin-reset-password.usecase';
import { AdminResetPasswordCommand } from './usecases/admin-reset-password/admin-reset-password.command';
import { AdminResetPasswordDto } from './dtos/admin-reset-password.dto';
import { UpdatePagePreferences } from './usecases/update-page-preferences/update-page-preferences.usecase';
import { UpdatePagePreferencesCommand } from './usecases/update-page-preferences/update-page-preferences.command';
import { UpdatePagePreferencesDto } from './dtos/update-page-preferences.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly inviteUser: InviteUser,
    private readonly acceptInvite: AcceptInvite,
    private readonly resendInvite: ResendInvite,
    private readonly blockUser: BlockUser,
    private readonly unblockUser: UnblockUser,
    private readonly updateUser: UpdateUser,
    private readonly getCurrentUser: GetCurrentUser,
    private readonly listUsers: ListUsers,
    private readonly listUsersDropdown: ListUsersDropdown,
    private readonly updateProfile: UpdateProfile,
    private readonly createUser: CreateUser,
    private readonly completeTour: CompleteTour,
    private readonly setManager: SetManager,
    private readonly getUserHierarchy: GetUserHierarchy,
    private readonly getUserDescendants: GetUserDescendants,
    private readonly adminResetPassword: AdminResetPassword,
    private readonly updatePagePrefs: UpdatePagePreferences,
  ) {}

  @Post('invite')
  @RequirePermissions(PERMISSIONS_ENUM.USER_CREATE)
  @ApiOperation({ summary: 'Invite a new user to the organization' })
  @ApiResponse({ status: 201, type: InviteResponseDto })
  async invite(
    @UserSession() user: UserSessionData,
    @Body() dto: InviteUserDto,
  ): Promise<InviteResponseDto> {
    return this.inviteUser.execute(
      InviteUserCommand.create({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        organizationId: user.organizationId,
        invitedBy: user.userId,
        roleId: dto.roleId,
      }),
    );
  }

  @Post('create')
  @RequirePermissions(PERMISSIONS_ENUM.USER_CREATE)
  @ApiOperation({
    summary: 'Directly create a user (immediately active with password)',
  })
  @ApiResponse({ status: 201 })
  async create(
    @UserSession() user: UserSessionData,
    @Body() dto: CreateUserDto,
  ) {
    return this.createUser.execute(
      CreateUserCommand.create({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        organizationId: user.organizationId,
        createdBy: user.userId,
        roleId: dto.roleId,
        password: dto.password,
        notifyUser: dto.notifyUser,
      }),
    );
  }

  @Post('accept-invite')
  @ApiOperation({ summary: 'Accept invitation and complete onboarding' })
  @ApiResponse({ status: 200 })
  async acceptInvitation(@Body() dto: AcceptInviteDto) {
    return this.acceptInvite.execute(
      AcceptInviteCommand.create({
        inviteToken: dto.inviteToken,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: dto.password,
      }),
    );
  }

  @Post('resend-invite')
  @RequirePermissions(PERMISSIONS_ENUM.USER_CREATE)
  @ApiOperation({ summary: 'Resend invitation to a pending user' })
  @ApiResponse({ status: 200, type: InviteResponseDto })
  async resendInvitation(
    @UserSession() user: UserSessionData,
    @Body() dto: ResendInviteDto,
  ) {
    return this.resendInvite.execute(
      ResendInviteCommand.create({
        userId: dto.userId,
        organizationId: user.organizationId,
        currentUserId: user.userId,
      }),
    );
  }

  @Get('names')
  @RequireAnyPermission(PERMISSION_BASE.USER_LIST_READ)
  @ApiOperation({ summary: 'List users for dropdown (id, name, email only)' })
  @ApiResponse({ status: 200, type: [UserDropdownDto] })
  async listNames(
    @UserSession() user: UserSessionData,
    @Query('teamOnly') teamOnly?: string,
  ): Promise<UserDropdownDto[]> {
    return this.listUsersDropdown.execute(
      ListUsersDropdownCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        teamOnly: teamOnly === 'true',
      }),
    );
  }

  @Put('me/page-preferences')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Update page preferences (saved views, columns)' })
  @ApiResponse({ status: 200 })
  async updatePagePreferences(
    @UserSession() user: UserSessionData,
    @Body() dto: UpdatePagePreferencesDto,
  ) {
    return this.updatePagePrefs.execute(
      UpdatePagePreferencesCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        page: dto.page,
        savedViews: dto.savedViews,
        columns: dto.columns,
      }),
    );
  }

  @Get('me')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getProfile(
    @UserSession() user: UserSessionData,
  ): Promise<UserResponseDto> {
    return this.getCurrentUser.execute(user.userId) as any;
  }

  @Put('profile')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateCurrentProfile(
    @UserSession() user: UserSessionData,
    @Body() dto: UpdateProfileDto,
  ): Promise<Partial<UserResponseDto>> {
    return this.updateProfile.execute(
      UpdateProfileCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        firstName: dto.firstName,
        lastName: dto.lastName,
      }),
    );
  }

  @Put('tour-complete')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Mark tour as completed for current user' })
  @ApiResponse({ status: 200 })
  async markTourComplete(
    @UserSession() user: UserSessionData,
  ): Promise<{ tourCompleted: boolean }> {
    return this.completeTour.execute(
      CompleteTourCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Get('hierarchy')
  @RequirePermissions(PERMISSION_BASE.USER_LIST_READ)
  @ApiOperation({ summary: 'Get organization user hierarchy' })
  @ApiResponse({ status: 200 })
  async hierarchy(@UserSession() user: UserSessionData) {
    return this.getUserHierarchy.execute(
      GetUserHierarchyCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSION_BASE.USER_LIST_READ)
  @ApiOperation({
    summary: 'List users in organization with pagination and filters',
  })
  @ApiOkPaginatedResponse(UserResponseDto)
  async listOrganizationUsers(
    @UserSession() user: UserSessionData,
    @Body() dto: ListUsersDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.listUsers.execute(
      ListUsersCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        status: dto.status,
        search: dto.search,
        invitedBy: dto.invitedBy,
        page: dto.page,
        limit: dto.limit,
        permissions: user.permissions,
      }),
    );
  }

  @Post(':id/reset-password')
  @RequirePermissions(PERMISSION_BASE.USER_UPDATE)
  @ApiOperation({ summary: 'Reset password for a user (admin action)' })
  @ApiResponse({ status: 200 })
  async resetPassword(
    @UserSession() user: UserSessionData,
    @Param('id') targetUserId: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.adminResetPassword.execute(
      AdminResetPasswordCommand.create({
        targetUserId,
        organizationId: user.organizationId,
        currentUserId: user.userId,
        notifyUser: dto.notifyUser,
      }),
    );
  }

  @Put(':id')
  @RequirePermissions(PERMISSION_BASE.USER_UPDATE)
  @ApiOperation({ summary: 'Update user details (firstName, lastName)' })
  @ApiResponse({ status: 200 })
  async update(
    @UserSession() user: UserSessionData,
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUser.execute(
      UpdateUserCommand.create({
        userId,
        organizationId: user.organizationId,
        currentUserId: user.userId,
        currentUserRoleId: user.roleId,
        permissions: user.permissions,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: dto.roleId,
      }),
    );
  }

  @Post(':id/block')
  @RequirePermissions(PERMISSIONS_ENUM.USER_UPDATE_STATUS)
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 200 })
  async block(
    @UserSession() user: UserSessionData,
    @Param('id') userId: string,
  ) {
    return this.blockUser.execute(
      BlockUserCommand.create({
        userId,
        organizationId: user.organizationId,
        currentUserId: user.userId,
      }),
    );
  }

  @Post(':id/unblock')
  @RequirePermissions(PERMISSIONS_ENUM.USER_UPDATE_STATUS)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200 })
  async unblock(
    @UserSession() user: UserSessionData,
    @Param('id') userId: string,
  ) {
    return this.unblockUser.execute(
      UnblockUserCommand.create({
        userId,
        organizationId: user.organizationId,
        currentUserId: user.userId,
      }),
    );
  }

  @Post(':id/set-manager')
  @RequirePermissions(PERMISSIONS_ENUM.TEAM_MANAGE)
  @ApiOperation({ summary: 'Set or change manager for a user' })
  @ApiResponse({ status: 200 })
  async setUserManager(
    @UserSession() user: UserSessionData,
    @Param('id') targetUserId: string,
    @Body() dto: SetManagerDto,
  ) {
    return this.setManager.execute(
      SetManagerCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        targetUserId,
        managerId: dto.managerId ?? null,
      }),
    );
  }

  @Get(':id/descendants')
  @RequirePermissions(PERMISSION_BASE.USER_LIST_READ)
  @ApiOperation({ summary: 'Get all descendant user IDs' })
  @ApiResponse({ status: 200 })
  async descendants(
    @UserSession() user: UserSessionData,
    @Param('id') targetUserId: string,
  ) {
    return this.getUserDescendants.execute(
      GetUserDescendantsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        targetUserId,
      }),
    );
  }
}
