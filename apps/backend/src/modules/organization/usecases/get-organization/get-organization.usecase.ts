import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from '@db/repositories';
import { GetOrganizationCommand } from './get-organization.command';
import { OrganizationResponseDto } from '../../dtos';

@Injectable()
export class GetOrganization {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    command: GetOrganizationCommand,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationRepository.findById(
      command.organizationId,
    );

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      domain: organization.domain,
      logo: organization.logo,
      phone: organization.phone,
      email: organization.email,
      website: organization.website,
      address: organization.address,
      pdfTemplate: organization.pdfTemplate,
      privacyPolicyUrl: organization.privacyPolicyUrl,
      termsAndConditionsUrl: organization.termsAndConditionsUrl,
      clientAppConfig: organization.clientAppConfig
        ? {
            showGoogleLogin: organization.clientAppConfig.showGoogleLogin,
            showAppleLogin: organization.clientAppConfig.showAppleLogin,
            hideDietitianName: organization.clientAppConfig.hideDietitianName,
          }
        : null,
      featureControls: organization.featureControls ?? null,
      invoiceSettings: organization.invoiceSettings || null,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
