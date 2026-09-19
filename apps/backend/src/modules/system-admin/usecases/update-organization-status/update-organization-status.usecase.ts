import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { OrganizationRepository, UserRepository } from '@db/repositories';
import { OrganizationStatus } from '@db/enums';

import { UpdateOrganizationStatusCommand } from './update-organization-status.command';

@Injectable()
export class UpdateOrganizationStatus {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: UpdateOrganizationStatusCommand) {
    const organization = await this.organizationRepository.findOne({
      where: { id: command.targetOrganizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.isSystemOrg) {
      throw new BadRequestException('Cannot modify system organization status');
    }

    organization.status = command.status;
    const updatedOrg = await this.organizationRepository.save(organization);

    if (command.status === OrganizationStatus.SUSPENDED) {
      await this.userRepository
        .createQueryBuilder()
        .update()
        .set({ refreshToken: null, refreshTokenExpires: null })
        .where('"organizationId" = :orgId', {
          orgId: command.targetOrganizationId,
        })
        .execute();
    }

    return {
      id: updatedOrg.id,
      name: updatedOrg.name,
      slug: updatedOrg.slug,
      status: updatedOrg.status,
    };
  }
}
