import { CandidateEntity, CustomFieldDefinitionEntity } from '@db/entities';

export function toPortalCustomFields(
  definitions: CustomFieldDefinitionEntity[],
) {
  return definitions.map((d) => ({
    key: d.key,
    label: d.label,
    type: d.type,
    options: d.options,
    required: d.required,
  }));
}

export function toPortalProfile(
  candidate: CandidateEntity,
  definitions: CustomFieldDefinitionEntity[],
) {
  const visible = new Set(definitions.map((d) => d.key));
  return {
    id: candidate.id,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.location,
    headline: candidate.headline,
    linkedinUrl: candidate.linkedinUrl,
    cvFileName: candidate.cvFileName,
    customFields: Object.fromEntries(
      Object.entries(candidate.customFields ?? {}).filter(([key]) =>
        visible.has(key),
      ),
    ),
  };
}
