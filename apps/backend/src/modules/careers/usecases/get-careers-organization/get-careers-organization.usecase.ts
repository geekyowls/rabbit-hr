import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '@db/repositories';
import { findCareersOrganization } from '../careers-query';
import { GetCareersOrganizationCommand } from './get-careers-organization.command';

@Injectable()
export class GetCareersOrganization {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(command: GetCareersOrganizationCommand) {
    const organization = await findCareersOrganization(
      this.organizationRepository,
      command.orgSlug,
    );
    return {
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      website: organization.website,
    };
  }
}
