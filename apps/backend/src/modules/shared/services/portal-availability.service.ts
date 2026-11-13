import { Injectable } from '@nestjs/common';
import { PlanFeature } from '@boilerplate/core';
import { OrganizationEntity, resolveAtsSettings } from '@db/entities';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';

@Injectable()
export class PortalAvailabilityService {
  constructor(private readonly entitlements: BillingEntitlementsService) {}

  async isEnabled(
    organization: Pick<OrganizationEntity, 'id' | 'atsSettings'>,
  ): Promise<boolean> {
    if (!resolveAtsSettings(organization.atsSettings).portalEnabled) {
      return false;
    }
    return this.entitlements.hasFeature(
      organization.id,
      PlanFeature.CANDIDATE_PORTAL,
    );
  }
}
