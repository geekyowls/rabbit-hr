import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ActivityRepository, CandidateRepository } from '@db/repositories';
import { CandidateEntity } from '@db/entities';
import { ActivityType, CustomFieldEntityType } from '@db/enums';
import { CustomFieldValidator } from '@shared/services/custom-field-validator.service';
import { pickDefined } from '@shared/helpers/pick-defined';
import { loadPortalCandidate } from '../portal-query';
import { toPortalProfile } from '../portal-profile';
import { UpdatePortalProfileCommand } from './update-portal-profile.command';

const FIELD_LABELS: Record<string, string> = {
  firstName: 'first name',
  lastName: 'last name',
  phone: 'phone',
  location: 'location',
  headline: 'headline',
  linkedinUrl: 'LinkedIn',
  customFields: 'additional details',
};

@Injectable()
export class UpdatePortalProfile {
  constructor(
    private readonly dataSource: DataSource,
    private readonly candidateRepository: CandidateRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly customFieldValidator: CustomFieldValidator,
  ) {}

  async execute(command: UpdatePortalProfileCommand) {
    const { organizationId, candidateId } = command;
    const { customFields, ...fields } = command.payload;
    const candidate = await loadPortalCandidate(
      this.candidateRepository,
      candidateId,
      organizationId,
    );
    const definitions = await this.customFieldValidator.getActiveDefinitions(
      organizationId,
      CustomFieldEntityType.CANDIDATE,
      true,
    );

    const changes: Partial<
      Pick<
        CandidateEntity,
        | 'firstName'
        | 'lastName'
        | 'phone'
        | 'location'
        | 'headline'
        | 'linkedinUrl'
        | 'customFields'
      >
    > = {};
    for (const [key, value] of Object.entries(pickDefined(fields))) {
      const field = key as keyof typeof fields;
      if (candidate[field] !== value) {
        Object.assign(changes, { [field]: value });
      }
    }
    if (customFields) {
      const next = await this.customFieldValidator.validate(
        organizationId,
        CustomFieldEntityType.CANDIDATE,
        customFields,
        { existing: candidate.customFields, careersOnly: true },
      );
      if (JSON.stringify(next) !== JSON.stringify(candidate.customFields)) {
        changes.customFields = next;
      }
    }

    const changed = Object.keys(changes);
    if (changed.length === 0) {
      return toPortalProfile(candidate, definitions);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        CandidateEntity,
        { id: candidateId, organizationId },
        changes,
      );
      await this.activityRepository.record(
        {
          organizationId,
          candidateId,
          type: ActivityType.PORTAL,
          title: 'Candidate updated profile',
          body: `Updated ${changed.map((key) => FIELD_LABELS[key] ?? key).join(', ')}`,
          metadata: {
            source: 'portal',
            action: 'profile_update',
            fields: changed,
          },
          actorId: null,
        },
        manager,
      );
    });

    return toPortalProfile({ ...candidate, ...changes }, definitions);
  }
}
