export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeTags(tags: string[]): string[] {
  return tags
    .map(normalizeTag)
    .filter((tag) => tag.length > 0)
    .filter((tag, index, self) => self.indexOf(tag) === index);
}

export function parseAllergyString(value: string | null | undefined): string[] {
  if (!value) return [];
  return normalizeTags(value.split(','));
}

export function formatTagsAsDisplayString(
  tags: string[] | null | undefined,
): string {
  if (!tags || tags.length === 0) return '';
  return tags.map((t) => t.replace(/-/g, ' ')).join(', ');
}

export function resolveAllergyFields(
  allergiesInput: string | null | undefined,
  allergyTagsInput: string[] | null | undefined,
): { allergies: string | null; allergyTags: string[] } {
  if (allergyTagsInput && allergyTagsInput.length > 0) {
    const tags = normalizeTags(allergyTagsInput);
    return {
      allergyTags: tags,
      allergies: tags.length > 0 ? formatTagsAsDisplayString(tags) : null,
    };
  }
  const trimmed = (allergiesInput ?? '').trim();
  if (!trimmed) return { allergies: null, allergyTags: [] };
  return {
    allergies: trimmed,
    allergyTags: parseAllergyString(trimmed),
  };
}

export function resolveMedicalConditionFields(
  medicalConditionsInput: string | null | undefined,
  medicalConditionTagsInput: string[] | null | undefined,
): { medicalConditions: string | null; medicalConditionTags: string[] } {
  if (medicalConditionTagsInput && medicalConditionTagsInput.length > 0) {
    const tags = normalizeTags(medicalConditionTagsInput);
    return {
      medicalConditionTags: tags,
      medicalConditions:
        tags.length > 0 ? formatTagsAsDisplayString(tags) : null,
    };
  }
  const trimmed = (medicalConditionsInput ?? '').trim();
  if (!trimmed) {
    return { medicalConditions: null, medicalConditionTags: [] };
  }
  return {
    medicalConditions: trimmed,
    medicalConditionTags: parseAllergyString(trimmed),
  };
}
