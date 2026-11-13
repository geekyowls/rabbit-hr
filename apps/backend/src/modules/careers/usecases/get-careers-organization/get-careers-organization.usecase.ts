import { Injectable } from '@nestjs/common';
import { resolveAtsSettings } from '@db/entities';
import { OrganizationRepository } from '@db/repositories';
import { PortalAvailabilityService } from '@shared/services/portal-availability.service';
import { findCareersOrganization } from '../careers-query';
import { GetCareersOrganizationCommand } from './get-careers-organization.command';

@Injectable()
export class GetCareersOrganization {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly portalAvailability: PortalAvailabilityService,
  ) {}

  async execute(command: GetCareersOrganizationCommand) {
    const organization = await findCareersOrganization(
      this.organizationRepository,
      command.orgSlug,
    );
    const settings = resolveAtsSettings(organization.atsSettings);
    return {
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      website: organization.website,
      brandColor: settings.brandColor,
      portalEnabled: await this.portalAvailability.isEnabled(organization),
    };
  }
}
