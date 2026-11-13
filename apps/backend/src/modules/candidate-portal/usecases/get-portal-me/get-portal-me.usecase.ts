import { Injectable } from '@nestjs/common';
import { CandidateRepository, OrganizationRepository } from '@db/repositories';
import { CustomFieldEntityType } from '@db/enums';
import { CustomFieldValidator } from '@shared/services/custom-field-validator.service';
import { PortalAvailabilityService } from '@shared/services/portal-availability.service';
import {
  loadPortalCandidate,
  loadPortalOrganization,
  toPortalBranding,
} from '../portal-query';
import { toPortalCustomFields, toPortalProfile } from '../portal-profile';
import { PortalCandidateCommand } from '../portal-candidate.command';

@Injectable()
export class GetPortalMe {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly customFieldValidator: CustomFieldValidator,
    private readonly portalAvailability: PortalAvailabilityService,
  ) {}

  async execute(command: PortalCandidateCommand) {
    const [candidate, organization, definitions] = await Promise.all([
      loadPortalCandidate(
        this.candidateRepository,
        command.candidateId,
        command.organizationId,
      ),
      loadPortalOrganization(
        this.organizationRepository,
        command.organizationId,
      ),
      this.customFieldValidator.getActiveDefinitions(
        command.organizationId,
        CustomFieldEntityType.CANDIDATE,
        true,
      ),
    ]);
    return {
      candidate: toPortalProfile(candidate, definitions),
      organization: toPortalBranding(
        organization,
        await this.portalAvailability.isEnabled(organization),
      ),
      customFields: toPortalCustomFields(definitions),
    };
  }
}
