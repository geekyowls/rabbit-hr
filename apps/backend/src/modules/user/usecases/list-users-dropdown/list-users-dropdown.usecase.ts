import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { UserRepository } from '../../../../database/repositories';
import { UserStatus } from '@db/enums';
import { TeamScopeService } from '@shared/services/team-scope.service';
import { ListUsersDropdownCommand } from './list-users-dropdown.command';

@Injectable()
export class ListUsersDropdown {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly teamScopeService: TeamScopeService,
  ) {}

  async execute(command: ListUsersDropdownCommand): Promise<
    Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    }>
  > {
    if (command.teamOnly) {
      const teamIds = await this.teamScopeService.getTeamMemberIds(
        command.userId,
        command.organizationId,
      );
      if (!teamIds.length) return [];
      return this.userRepository.find({
        where: {
          id: In(teamIds),
          organizationId: command.organizationId,
          status: UserStatus.ACTIVE,
        },
        select: ['id', 'firstName', 'lastName', 'email'],
        order: { firstName: 'ASC', lastName: 'ASC', email: 'ASC' },
      });
    }

    return this.userRepository.findDropdownByOrganizationId(
      command.organizationId,
    );
  }
}
