import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository, OrganizationRepository } from '@db/repositories';
import { UpdateOnboardingContextCommand } from './update-onboarding-context.command';

@Injectable()
export class UpdateOnboardingContext {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    command: UpdateOnboardingContextCommand,
  ): Promise<{ success: boolean }> {
    const organization = await this.organizationRepository.findOne({
      where: { id: command.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    organization.metadata = {
      ...(organization.metadata ?? {}),
      agencySize: command.agencySize,
    };
    const organizationName = command.organizationName?.trim();
    if (organizationName) {
      organization.name = organizationName;
    }
    await this.organizationRepository.save(organization);

    await this.userRepository.update(command.userId, {
      onboarded: true,
      ...(command.phone
        ? {
            phone: command.phone,
            phoneCountryCode: command.phoneCountryCode || 'GB',
          }
        : {}),
    });

    return { success: true };
  }
}
