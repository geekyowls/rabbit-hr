import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '@db/repositories';
import { PortalAvailabilityService } from '@shared/services/portal-availability.service';
import {
  findPortalOrganizationBySlug,
  PortalBranding,
  toPortalBranding,
} from '../portal-query';
import { GetPortalBrandingCommand } from './get-portal-branding.command';

@Injectable()
export class GetPortalBranding {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly portalAvailability: PortalAvailabilityService,
  ) {}

  async execute(command: GetPortalBrandingCommand): Promise<PortalBranding> {
    const organization = await findPortalOrganizationBySlug(
      this.organizationRepository,
      this.portalAvailability,
      command.orgSlug,
      { requireEnabled: false },
    );
    return toPortalBranding(
      organization,
      await this.portalAvailability.isEnabled(organization),
    );
  }
}
