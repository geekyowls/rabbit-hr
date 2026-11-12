import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CustomFieldDefinitionEntity,
  CustomFieldValue,
  CustomFieldValues,
} from '@db/entities';
import { CustomFieldDefinitionRepository } from '@db/repositories';
import { CustomFieldEntityType, CustomFieldType } from '@db/enums';

const TEXT_MAX_LENGTH = 1000;
const TEXTAREA_MAX_LENGTH = 10000;
const URL_MAX_LENGTH = 2000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface CustomFieldValidationOptions {
  existing?: CustomFieldValues;
  careersOnly?: boolean;
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function coerceValue(
  definition: CustomFieldDefinitionEntity,
  value: unknown,
): CustomFieldValue {
  const fail = (reason: string): never => {
    throw new BadRequestException(`${definition.label}: ${reason}`);
  };

  switch (definition.type) {
    case CustomFieldType.TEXT:
    case CustomFieldType.TEXTAREA: {
      if (typeof value !== 'string') return fail('must be text');
      const max =
        definition.type === CustomFieldType.TEXT
          ? TEXT_MAX_LENGTH
          : TEXTAREA_MAX_LENGTH;
      if (value.length > max) return fail(`must be at most ${max} characters`);
      return value.trim();
    }
    case CustomFieldType.NUMBER:
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fail('must be a number');
      }
      return value;
    case CustomFieldType.DATE:
      if (typeof value !== 'string' || !isValidDate(value)) {
        return fail('must be a date in YYYY-MM-DD format');
      }
      return value;
    case CustomFieldType.BOOLEAN:
      if (typeof value !== 'boolean') return fail('must be true or false');
      return value;
    case CustomFieldType.URL:
      if (
        typeof value !== 'string' ||
        value.length > URL_MAX_LENGTH ||
        !isValidUrl(value.trim())
      ) {
        return fail('must be a valid http or https URL');
      }
      return value.trim();
    case CustomFieldType.SELECT:
      if (typeof value !== 'string' || !definition.options.includes(value)) {
        return fail(`must be one of ${definition.options.join(', ')}`);
      }
      return value;
    case CustomFieldType.MULTISELECT: {
      if (
        !Array.isArray(value) ||
        !value.every(
          (item) =>
            typeof item === 'string' && definition.options.includes(item),
        )
      ) {
        return fail(`values must be from ${definition.options.join(', ')}`);
      }
      return [...new Set(value as string[])];
    }
    default:
      return fail('has an unsupported type');
  }
}

@Injectable()
export class CustomFieldValidator {
  constructor(
    private readonly customFieldDefinitionRepository: CustomFieldDefinitionRepository,
  ) {}

  async getActiveDefinitions(
    organizationId: string,
    entity: CustomFieldEntityType,
    careersOnly = false,
  ): Promise<CustomFieldDefinitionEntity[]> {
    return this.customFieldDefinitionRepository.find({
      where: {
        organizationId,
        entity,
        isActive: true,
        ...(careersOnly && { showOnCareersForm: true }),
      },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async validate(
    organizationId: string,
    entity: CustomFieldEntityType,
    input: Record<string, unknown> | undefined,
    options: CustomFieldValidationOptions = {},
  ): Promise<CustomFieldValues> {
    const definitions = await this.getActiveDefinitions(
      organizationId,
      entity,
      options.careersOnly,
    );
    const byKey = new Map(definitions.map((d) => [d.key, d]));
    const payload = input ?? {};

    if (
      typeof payload !== 'object' ||
      payload === null ||
      Array.isArray(payload)
    ) {
      throw new BadRequestException('customFields must be an object');
    }

    const unknown = Object.keys(payload).filter((key) => !byKey.has(key));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown custom fields: ${unknown.join(', ')}`,
      );
    }

    const result: CustomFieldValues = { ...(options.existing ?? {}) };
    for (const [key, value] of Object.entries(payload)) {
      if (isEmpty(value)) {
        delete result[key];
        continue;
      }
      result[key] = coerceValue(byKey.get(key)!, value);
    }

    const missing = definitions.filter(
      (d) => d.required && isEmpty(result[d.key]),
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        `Required custom fields missing: ${missing.map((d) => d.label).join(', ')}`,
      );
    }

    return result;
  }
}
