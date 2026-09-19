import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { OrganizationRepository, UserRepository } from '@db/repositories';
import { UserEntity } from '@db/entities';
import { OrganizationStatus } from '@db/enums';
import { ALL_PERMISSIONS } from '@boilerplate/core';
import { AuthService } from '@modules/auth/services/auth.service';

import { AccessOrganizationCommand } from './access-organization.command';

@Injectable()
export class AccessOrganization {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(command: AccessOrganizationCommand) {
    const targetOrganization = await this.organizationRepository.findOne({
      where: { id: command.targetOrganizationId },
    });

    if (!targetOrganization) {
      throw new NotFoundException('Organization not found');
    }

    if (targetOrganization.isSystemOrg) {
      throw new BadRequestException('Cannot access system organization');
    }

    if (targetOrganization.status !== OrganizationStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot access organization that is not active',
      );
    }

    const systemAdminUser = await this.userRepository.findOne({
      where: { id: command.userId },
    });

    if (!systemAdminUser) {
      throw new NotFoundException('User not found');
    }

    const virtualUser: UserEntity = {
      ...systemAdminUser,
      organizationId: command.targetOrganizationId,
      roleId: null,
    } as UserEntity;

    const accessToken = this.authService.generateImpersonationToken(
      virtualUser,
      ALL_PERMISSIONS,
      command.userId,
    );

    return {
      accessToken,
      organization: {
        id: targetOrganization.id,
        name: targetOrganization.name,
        slug: targetOrganization.slug,
      },
    };
  }
}
