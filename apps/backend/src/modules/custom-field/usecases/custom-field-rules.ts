import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomFieldDefinitionEntity } from '@db/entities';
import { CustomFieldEntityType, CustomFieldType } from '@db/enums';

const OPTION_TYPES = [CustomFieldType.SELECT, CustomFieldType.MULTISELECT];

const ENTITY_TABLES: Record<CustomFieldEntityType, string> = {
  [CustomFieldEntityType.CANDIDATE]: 'candidates',
  [CustomFieldEntityType.JOB]: 'jobs',
};

export function normalizeOptions(options: string[] | undefined): string[] {
  const seen = new Set<string>();
  return (options ?? [])
    .map((o) => o.trim())
    .filter((o) => {
      if (!o || seen.has(o)) return false;
      seen.add(o);
      return true;
    });
}

export function assertDefinitionRules(
  definition: Pick<
    CustomFieldDefinitionEntity,
    'entity' | 'type' | 'options' | 'showOnCareersForm'
  >,
): void {
  const needsOptions = OPTION_TYPES.includes(definition.type);
  if (needsOptions && definition.options.length === 0) {
    throw new BadRequestException('Select fields need at least one option');
  }
  if (!needsOptions && definition.options.length > 0) {
    throw new BadRequestException('Only select fields can have options');
  }
  if (
    definition.showOnCareersForm &&
    definition.entity !== CustomFieldEntityType.CANDIDATE
  ) {
    throw new BadRequestException(
      'Only candidate fields can be shown on the careers form',
    );
  }
}

export async function countCustomFieldValues(
  dataSource: DataSource,
  definition: Pick<
    CustomFieldDefinitionEntity,
    'organizationId' | 'entity' | 'key'
  >,
): Promise<number> {
  const rows: Array<{ count: string }> = await dataSource.query(
    `SELECT COUNT(*) AS count FROM ${ENTITY_TABLES[definition.entity]} WHERE "organizationId" = $1 AND jsonb_exists("customFields", $2)`,
    [definition.organizationId, definition.key],
  );
  return Number(rows[0]?.count ?? 0);
}
