import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '@db/repositories';
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
  ) {}

  async execute(command: GetPortalBrandingCommand): Promise<PortalBranding> {
    const organization = await findPortalOrganizationBySlug(
      this.organizationRepository,
      command.orgSlug,
      { requireEnabled: false },
    );
    return toPortalBranding(organization);
  }
}
