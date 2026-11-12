import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgSubscriptionStatus } from '@boilerplate/core';
import { OrganizationRepository } from '@db/repositories';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';
import { UpdateOrganizationBillingCommand } from './update-organization-billing.command';

@Injectable()
export class UpdateOrganizationBilling {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async execute(command: UpdateOrganizationBillingCommand) {
    const organization = await this.organizationRepository.findOne({
      where: { id: command.targetOrganizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    if (organization.isSystemOrg) {
      throw new BadRequestException(
        'Cannot change billing of the system organization',
      );
    }

    if (command.plan !== undefined) organization.plan = command.plan;
    if (command.status !== undefined) {
      organization.subscriptionStatus = command.status;
      organization.pastDueSince =
        command.status === OrgSubscriptionStatus.PAST_DUE
          ? (organization.pastDueSince ?? new Date())
          : null;
    }
    if (command.memberLimitOverride !== undefined) {
      organization.memberLimitOverride = command.memberLimitOverride;
    }
    if (command.trialEndsAt !== undefined) {
      organization.trialEndsAt = command.trialEndsAt
        ? new Date(command.trialEndsAt)
        : null;
    }
    if (command.subscriptionEndsAt !== undefined) {
      organization.subscriptionEndsAt = command.subscriptionEndsAt
        ? new Date(command.subscriptionEndsAt)
        : null;
    }

    const saved = await this.organizationRepository.save(organization);
    await this.entitlements.invalidate(saved.id);
    return {
      id: saved.id,
      plan: saved.plan,
      subscriptionStatus: saved.subscriptionStatus,
      memberLimitOverride: saved.memberLimitOverride,
      trialEndsAt: saved.trialEndsAt,
      subscriptionEndsAt: saved.subscriptionEndsAt,
    };
  }
}
