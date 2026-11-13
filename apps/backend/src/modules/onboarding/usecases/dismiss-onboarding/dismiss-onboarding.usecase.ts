import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '@db/repositories';
import { OnboardingChecklistDto } from '../../dtos/onboarding.dto';
import { OnboardingCache } from '../../onboarding-cache.service';
import { GetOnboardingChecklist } from '../get-onboarding-checklist/get-onboarding-checklist.usecase';
import { OnboardingCommand } from '../onboarding.command';

@Injectable()
export class DismissOnboarding {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly cache: OnboardingCache,
    private readonly getChecklist: GetOnboardingChecklist,
  ) {}

  async execute(command: OnboardingCommand): Promise<OnboardingChecklistDto> {
    const organization = await this.organizationRepository.findOneOrFail({
      where: { id: command.organizationId },
      select: ['id', 'metadata'],
    });
    await this.organizationRepository.update(organization.id, {
      metadata: {
        ...(organization.metadata ?? {}),
        onboardingDismissedAt: new Date().toISOString(),
      },
    });
    await this.cache.invalidate(organization.id);
    return this.getChecklist.execute(command);
  }
}
