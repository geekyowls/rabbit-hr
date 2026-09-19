export type OrganizationConfigType =
  | 'client_tag'
  | 'message_template'
  | 'medical_condition'
  | 'allergy'
  | 'health_objective';

export interface ConfigItem {
  id: string;
  name: string;
  isDefault: boolean;
}

export type ClientTag = ConfigItem;

export interface OrganizationConfig {
  clientTags: ConfigItem[];
  messageTemplates: ConfigItem[];
  medicalConditions: ConfigItem[];
  allergies: ConfigItem[];
  healthObjectives: ConfigItem[];
}
