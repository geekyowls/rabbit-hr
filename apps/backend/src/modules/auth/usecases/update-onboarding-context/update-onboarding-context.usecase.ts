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

    const { teamSize: _prevTeamSize, ...restMetadata } =
      organization.metadata || {};
    organization.metadata = {
      ...restMetadata,
      practiceType: command.practiceType,
      ...(command.practiceType === 'team' && command.teamSize
        ? { teamSize: command.teamSize }
        : {}),
    };
    await this.organizationRepository.save(organization);

    await this.userRepository.update(command.userId, {
      onboarded: true,
      ...(command.phone
        ? {
            phone: command.phone,
            phoneCountryCode: command.phoneCountryCode || 'IN',
          }
        : {}),
    });

    return { success: true };
  }
}
