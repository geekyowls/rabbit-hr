import { Injectable } from '@nestjs/common';
import { In, Not } from 'typeorm';
import { OnboardingStepKey, PlanFeature } from '@boilerplate/core';
import { OrganizationEntity } from '@db/entities';
import {
  ClientRepository,
  JobRepository,
  MailboxConnectionRepository,
  OrganizationRepository,
} from '@db/repositories';
import { JobStatus, MailboxConnectionStatus } from '@db/enums';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';
import {
  OnboardingChecklistDto,
  OnboardingStepDto,
} from '../../dtos/onboarding.dto';
import { OnboardingCache } from '../../onboarding-cache.service';
import { OnboardingCommand } from '../onboarding.command';

function excluding(ids: string[] | undefined) {
  return ids && ids.length > 0 ? { id: Not(In(ids)) } : {};
}

function hasCompanyDetails(organization: OrganizationEntity): boolean {
  return (
    !!organization.logo &&
    !!organization.name?.trim() &&
    !!(organization.email || organization.phone || organization.website)
  );
}

@Injectable()
export class GetOnboardingChecklist {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly clientRepository: ClientRepository,
    private readonly jobRepository: JobRepository,
    private readonly mailboxConnectionRepository: MailboxConnectionRepository,
    private readonly entitlements: BillingEntitlementsService,
    private readonly cache: OnboardingCache,
  ) {}

  async execute(command: OnboardingCommand): Promise<OnboardingChecklistDto> {
    const { organizationId } = command;
    const cached = await this.cache.read(organizationId);
    if (cached) return cached;

    const organization = await this.organizationRepository.findOneOrFail({
      where: { id: organizationId },
      select: [
        'id',
        'name',
        'logo',
        'email',
        'phone',
        'website',
        'atsSettings',
        'metadata',
      ],
    });
    const sample = organization.metadata?.sampleData;
    const state = await this.entitlements.getState(organizationId);
    const features = this.entitlements.featuresFor(state);
    const memberLimit = this.entitlements.memberLimitFor(state);

    const [members, clients, publishedJobs, mailboxes] = await Promise.all([
      this.entitlements.countMembers(organizationId),
      this.clientRepository.count({
        where: { organizationId, ...excluding(sample?.clientIds) },
      }),
      this.jobRepository.count({
        where: {
          organizationId,
          status: JobStatus.PUBLISHED,
          ...excluding(sample?.jobIds),
        },
      }),
      features.includes(PlanFeature.INBOX)
        ? this.mailboxConnectionRepository.count({
            where: {
              organizationId,
              status: MailboxConnectionStatus.CONNECTED,
              isDemo: false,
            },
          })
        : Promise.resolve(null),
    ]);

    const teamLocked = memberLimit !== null && memberLimit <= 1;
    const steps: OnboardingStepDto[] = [
      this.step(OnboardingStepKey.COMPANY, hasCompanyDetails(organization)),
      this.step(OnboardingStepKey.REGION, !!organization.atsSettings),
      this.step(OnboardingStepKey.TEAM, members > 1, teamLocked),
      this.step(OnboardingStepKey.CLIENT, clients > 0),
      this.step(OnboardingStepKey.JOB, publishedJobs > 0),
      ...(mailboxes === null
        ? []
        : [this.step(OnboardingStepKey.INBOX, mailboxes > 0)]),
    ];
    const counted = steps.filter((step) => !step.upgradeRequired);
    const checklist: OnboardingChecklistDto = {
      steps,
      completed: counted.filter((step) => step.done).length,
      total: counted.length,
      dismissed: !!organization.metadata?.onboardingDismissedAt,
      hasSampleData: !!sample,
    };
    await this.cache.write(organizationId, checklist);
    return checklist;
  }

  private step(
    key: OnboardingStepKey,
    done: boolean,
    upgradeRequired: boolean = false,
  ): OnboardingStepDto {
    return { key, done: done && !upgradeRequired, upgradeRequired };
  }
}
