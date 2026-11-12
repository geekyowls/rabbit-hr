import { z } from 'zod/v4';
import type {
  CustomFieldDefinition,
  CustomFieldType,
  CustomFieldValues,
} from '@/types/custom-field.type';

export type CustomFieldLike = Pick<
  CustomFieldDefinition,
  'key' | 'label' | 'type' | 'options' | 'required'
>;

export type CustomFieldFormValue = string | boolean | string[];
export type CustomFieldFormValues = Record<string, CustomFieldFormValue>;

export const CUSTOM_FIELD_TYPE_LABEL: Record<CustomFieldType, string> = {
  text: 'Short text',
  textarea: 'Long text',
  number: 'Number',
  date: 'Date',
  select: 'Single select',
  multiselect: 'Multi select',
  boolean: 'Yes or no',
  url: 'Link',
};

export const OPTION_FIELD_TYPES: CustomFieldType[] = ['select', 'multiselect'];

const NUMBER = /^-?\d+(\.\d+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function textSchema(field: CustomFieldLike, max: number) {
  const base = z.string().trim().max(max, `Keep it under ${max} characters`);
  return field.required ? base.min(1, `${field.label} is required`) : base;
}

function fieldSchema(field: CustomFieldLike) {
  const required = `${field.label} is required`;
  switch (field.type) {
    case 'boolean':
      return z.boolean();
    case 'multiselect': {
      const base = z.array(z.string());
      return field.required ? base.min(1, required) : base;
    }
    case 'textarea':
      return textSchema(field, 10000);
    case 'number':
      return textSchema(field, 50).refine(
        (v) => !v || NUMBER.test(v),
        'Enter a number',
      );
    case 'date':
      return textSchema(field, 10).refine(
        (v) => !v || DATE.test(v),
        'Enter a valid date',
      );
    case 'url':
      return textSchema(field, 2000).refine(
        (v) => !v || isHttpUrl(v),
        'Enter a link starting with http or https',
      );
    case 'select':
      return textSchema(field, 100).refine(
        (v) => !v || field.options.includes(v),
        'Choose one of the options',
      );
    default:
      return textSchema(field, 1000);
  }
}

export function buildCustomFieldsSchema(fields: CustomFieldLike[]) {
  return z.object(
    Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])),
  );
}

export function toCustomFieldFormValues(
  fields: CustomFieldLike[],
  values: CustomFieldValues | null | undefined = {},
): CustomFieldFormValues {
  return Object.fromEntries(
    fields.map((f) => {
      const value = values?.[f.key];
      if (f.type === 'boolean') return [f.key, value === true];
      if (f.type === 'multiselect') {
        return [f.key, Array.isArray(value) ? value : []];
      }
      return [
        f.key,
        value === null || value === undefined ? '' : String(value),
      ];
    }),
  );
}

export function mergeCustomFieldDefaults(
  fields: CustomFieldLike[],
  current: CustomFieldFormValues | undefined,
  values?: CustomFieldValues | null,
): CustomFieldFormValues | null {
  const existing = current ?? {};
  if (fields.every((f) => f.key in existing)) return null;
  return { ...toCustomFieldFormValues(fields, values), ...existing };
}

export function toCustomFieldPayload(
  fields: CustomFieldLike[],
  values: CustomFieldFormValues | undefined,
): CustomFieldValues {
  return Object.fromEntries(
    fields.map((f) => {
      const value = values?.[f.key];
      if (f.type === 'boolean') return [f.key, value === true];
      if (f.type === 'multiselect') {
        return [f.key, Array.isArray(value) && value.length ? value : null];
      }
      const text = typeof value === 'string' ? value.trim() : '';
      if (!text) return [f.key, null];
      return [f.key, f.type === 'number' ? Number(text) : text];
    }),
  );
}

export function toFieldKey(label: string) {
  const slug = label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  if (!slug) return '';
  return /^[a-z]/.test(slug) ? slug : `field_${slug}`.slice(0, 64);
}
