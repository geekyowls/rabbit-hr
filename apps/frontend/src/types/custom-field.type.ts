export type CustomFieldEntity = 'candidate' | 'job';

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'url';

export const CUSTOM_FIELD_TYPES: CustomFieldType[] = [
  'text',
  'textarea',
  'number',
  'date',
  'select',
  'multiselect',
  'boolean',
  'url',
];

export type CustomFieldValue = string | number | boolean | string[] | null;

export type CustomFieldValues = Record<string, CustomFieldValue>;

export interface CustomFieldDefinition {
  id: string;
  entity: CustomFieldEntity;
  key: string;
  label: string;
  type: CustomFieldType;
  options: string[];
  required: boolean;
  order: number;
  isActive: boolean;
  showOnCareersForm: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListCustomFieldsParams {
  entity?: CustomFieldEntity;
  activeOnly?: boolean;
}

export interface CreateCustomFieldRequest {
  entity: CustomFieldEntity;
  key?: string;
  label: string;
  type: CustomFieldType;
  options?: string[];
  required?: boolean;
  isActive?: boolean;
  showOnCareersForm?: boolean;
}

export type UpdateCustomFieldRequest = Partial<
  Omit<CreateCustomFieldRequest, 'entity' | 'key'>
>;

export interface ReorderCustomFieldsRequest {
  entity: CustomFieldEntity;
  ids: string[];
}

export interface DeleteCustomFieldResponse {
  deleted: boolean;
  deactivated: boolean;
}

export interface CareersCustomField {
  key: string;
  label: string;
  type: CustomFieldType;
  options: string[];
  required: boolean;
}
