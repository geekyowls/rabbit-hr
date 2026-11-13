import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { OrgSubscriptionStatus } from '@boilerplate/core';
import { OrganizationEntity } from '@db/entities';
import { OrganizationRepository } from '@db/repositories';
import { ContextLogger } from '@shared/framework/context-logger';
import { BillingEntitlementsService } from '../core/billing-entitlements.service';
import {
  ProviderSubscription,
  ProviderSubscriptionStatus,
} from './payment-provider.interface';

@Injectable()
export class SubscriptionSyncService {
  private readonly logger = new ContextLogger(SubscriptionSyncService.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async apply(
    source: string,
    subscription: ProviderSubscription,
  ): Promise<string | null> {
    const organization = await this.findOrganization(subscription);
    if (!organization) {
      this.logger.warn(
        `No organization for ${source} (${subscription.subscriptionId || 'no subscription id'})`,
      );
      return null;
    }
    const isCurrent =
      !organization.dodoSubscriptionId ||
      organization.dodoSubscriptionId === subscription.subscriptionId;

    switch (subscription.status) {
      case ProviderSubscriptionStatus.ACTIVE:
        this.applyActive(organization, subscription);
        break;
      case ProviderSubscriptionStatus.ON_HOLD:
        if (!isCurrent) return this.skip(organization, source);
        this.applyOnHold(organization);
        break;
      case ProviderSubscriptionStatus.FAILED:
        if (organization.dodoSubscriptionId !== subscription.subscriptionId) {
          return this.skip(organization, source);
        }
        this.applyOnHold(organization);
        break;
      case ProviderSubscriptionStatus.CANCELLED:
        if (!isCurrent) return this.skip(organization, source);
        this.applyCancelled(organization, subscription);
        break;
      case ProviderSubscriptionStatus.EXPIRED:
        if (!isCurrent) return this.skip(organization, source);
        organization.subscriptionStatus = OrgSubscriptionStatus.EXPIRED;
        organization.cancelAtPeriodEnd = false;
        break;
      case ProviderSubscriptionStatus.PENDING:
        return this.skip(organization, source);
    }

    if (subscription.customerId) {
      organization.dodoCustomerId = subscription.customerId;
    }
    await this.organizationRepository.save(organization);
    await this.entitlements.invalidate(organization.id);
    this.logger.log(
      `Applied ${source} to organization ${organization.id}: ${organization.subscriptionStatus}`,
    );
    return organization.id;
  }

  private applyActive(
    organization: OrganizationEntity,
    subscription: ProviderSubscription,
  ): void {
    if (subscription.selection) {
      organization.plan = subscription.selection.plan;
      organization.billingInterval = subscription.selection.interval;
    }
    organization.dodoSubscriptionId =
      subscription.subscriptionId || organization.dodoSubscriptionId;
    organization.subscriptionStatus = subscription.trialEndsAt
      ? OrgSubscriptionStatus.TRIAL
      : OrgSubscriptionStatus.ACTIVE;
    if (subscription.trialEndsAt) {
      organization.trialEndsAt = subscription.trialEndsAt;
    }
    organization.subscriptionEndsAt = subscription.currentPeriodEnd;
    organization.pastDueSince = null;
    organization.cancelAtPeriodEnd = subscription.cancelAtPeriodEnd;
  }

  private applyOnHold(organization: OrganizationEntity): void {
    organization.subscriptionStatus = OrgSubscriptionStatus.PAST_DUE;
    organization.pastDueSince = organization.pastDueSince ?? new Date();
  }

  private applyCancelled(
    organization: OrganizationEntity,
    subscription: ProviderSubscription,
  ): void {
    const periodEnd = subscription.currentPeriodEnd;
    const endsAtPeriodEnd =
      subscription.cancelAtPeriodEnd &&
      !!periodEnd &&
      periodEnd.getTime() > Date.now();
    organization.subscriptionStatus = OrgSubscriptionStatus.CANCELLED;
    organization.cancelAtPeriodEnd = false;
    organization.subscriptionEndsAt = endsAtPeriodEnd
      ? periodEnd
      : (subscription.cancelledAt ?? new Date());
  }

  private async findOrganization(
    subscription: ProviderSubscription,
  ): Promise<OrganizationEntity | null> {
    if (subscription.organizationId && isUUID(subscription.organizationId)) {
      const organization = await this.organizationRepository.findOne({
        where: { id: subscription.organizationId },
      });
      if (organization) return organization;
    }
    if (subscription.subscriptionId) {
      const organization = await this.organizationRepository.findOne({
        where: { dodoSubscriptionId: subscription.subscriptionId },
      });
      if (organization) return organization;
    }
    if (subscription.customerId) {
      return this.organizationRepository.findOne({
        where: { dodoCustomerId: subscription.customerId },
      });
    }
    return null;
  }

  private skip(organization: OrganizationEntity, source: string): null {
    this.logger.log(
      `Skipped ${source} for organization ${organization.id}, not the current subscription`,
    );
    return null;
  }
}
