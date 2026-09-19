import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from '@db/repositories';
import { UpdateOrganizationCommand } from './update-organization.command';
import { OrganizationResponseDto } from '../../dtos';

@Injectable()
export class UpdateOrganization {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    command: UpdateOrganizationCommand,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationRepository.findById(
      command.organizationId,
    );

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    organization.name = command.name;
    organization.logo = command.logo ?? null;
    organization.phone = command.phone ?? null;
    organization.email = command.email ?? null;
    organization.website = command.website ?? null;
    organization.address = command.address ?? null;
    if (command.pdfTemplate !== undefined) {
      organization.pdfTemplate = command.pdfTemplate;
    }
    if (command.privacyPolicyUrl !== undefined) {
      organization.privacyPolicyUrl = command.privacyPolicyUrl ?? null;
    }
    if (command.termsAndConditionsUrl !== undefined) {
      organization.termsAndConditionsUrl =
        command.termsAndConditionsUrl ?? null;
    }

    if (
      command.showGoogleLogin !== undefined ||
      command.showAppleLogin !== undefined ||
      command.hideDietitianName !== undefined
    ) {
      organization.clientAppConfig = {
        ...organization.clientAppConfig,
        ...(command.showGoogleLogin !== undefined && {
          showGoogleLogin: command.showGoogleLogin,
        }),
        ...(command.showAppleLogin !== undefined && {
          showAppleLogin: command.showAppleLogin,
        }),
        ...(command.hideDietitianName !== undefined && {
          hideDietitianName: command.hideDietitianName,
        }),
      };
    }

    if (
      command.reEngagementEmailsEnabled !== undefined ||
      command.dailyDigestEnabled !== undefined
    ) {
      organization.featureControls = {
        ...(organization.featureControls || {}),
        ...(command.reEngagementEmailsEnabled !== undefined && {
          reEngagementEmailsEnabled: command.reEngagementEmailsEnabled,
        }),
        ...(command.dailyDigestEnabled !== undefined && {
          dailyDigestEnabled: command.dailyDigestEnabled,
        }),
      };
    }

    if (command.invoiceSettings !== undefined) {
      organization.invoiceSettings = command.invoiceSettings;
    }

    const updated = await this.organizationRepository.save(organization);

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      domain: updated.domain,
      logo: updated.logo,
      phone: updated.phone,
      email: updated.email,
      website: updated.website,
      address: updated.address,
      pdfTemplate: updated.pdfTemplate,
      privacyPolicyUrl: updated.privacyPolicyUrl,
      termsAndConditionsUrl: updated.termsAndConditionsUrl,
      clientAppConfig: updated.clientAppConfig
        ? {
            showGoogleLogin: updated.clientAppConfig.showGoogleLogin,
            showAppleLogin: updated.clientAppConfig.showAppleLogin,
            hideDietitianName: updated.clientAppConfig.hideDietitianName,
          }
        : null,
      featureControls: updated.featureControls ?? null,
      invoiceSettings: updated.invoiceSettings || null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
