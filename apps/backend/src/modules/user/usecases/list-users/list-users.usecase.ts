import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRepository } from '@db/repositories';
import { UserStatus } from '@db/enums';
import {
  buildUrl,
  calculateSkip,
  createPaginationMetadata,
  getPermissionScope,
  PermissionScope,
  PERMISSION_BASE,
} from '@boilerplate/core';
import { TeamScopeService } from '@shared/services/team-scope.service';

import { ListUsersCommand } from './list-users.command';

@Injectable()
export class ListUsers {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly teamScopeService: TeamScopeService,
  ) {}

  async execute(command: ListUsersCommand) {
    const skip = calculateSkip(command.page, command.limit);

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoin('user.inviter', 'inviter')
      .leftJoin('user.manager', 'manager')
      .where('user.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.status',
        'user.isActive',
        'user.onboarded',
        'user.organizationId',
        'user.createdAt',
        'user.updatedAt',
        'user.invitedBy',
        'user.roleId',
        'user.managerId',
        'role.id',
        'role.name',
        'organization.id',
        'organization.name',
        'inviter.id',
        'inviter.firstName',
        'inviter.lastName',
        'inviter.email',
        'manager.id',
        'manager.firstName',
        'manager.lastName',
        'manager.email',
        'user.inviteExpires',
      ])
      .addSelect('user.inviteToken');

    // Apply filters
    if (command.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: command.status,
      });
    }

    if (command.search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${command.search}%` },
      );
    }

    if (command.invitedBy) {
      queryBuilder.andWhere('user.invitedBy = :invitedBy', {
        invitedBy: command.invitedBy,
      });
    }

    if (command.permissions) {
      const scope = getPermissionScope(
        command.permissions,
        PERMISSION_BASE.USER_LIST_READ,
      );
      if (scope === PermissionScope.OWN) {
        queryBuilder.andWhere('user.invitedBy = :currentUserId', {
          currentUserId: command.userId,
        });
      } else if (scope === PermissionScope.TEAM) {
        const teamIds = await this.teamScopeService.getTeamMemberIds(
          command.userId,
          command.organizationId,
        );
        queryBuilder.andWhere('user.id IN (:...teamIds)', { teamIds });
      }
    }

    // Pagination
    queryBuilder.skip(skip).take(command.limit);

    // Ordering
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL');
    const usersWithInviteLinks = users.map((user) => {
      const inviteLink =
        user.status === UserStatus.INVITED && user.inviteToken
          ? buildUrl(
              frontendBaseUrl,
              `/accept-invite?token=${user.inviteToken}`,
            )
          : null;

      // Exclude sensitive token from response - only return the link
      const { inviteToken, ...userWithoutToken } = user;

      return {
        ...userWithoutToken,
        inviteLink,
        inviteExpires: user.inviteExpires || null,
      };
    });

    return {
      data: usersWithInviteLinks,
      ...createPaginationMetadata(command.page, command.limit, total),
    };
  }
}
