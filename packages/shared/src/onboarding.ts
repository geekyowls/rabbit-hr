export const AGENCY_SIZES = ['solo', '2-5', '6-15', '16-50', '51+'] as const;

export type AgencySize = (typeof AGENCY_SIZES)[number];

export const AGENCY_SIZE_LABELS: Record<AgencySize, string> = {
  solo: 'Just me',
  '2-5': '2 to 5',
  '6-15': '6 to 15',
  '16-50': '16 to 50',
  '51+': '51 or more',
};

export enum OnboardingStepKey {
  COMPANY = 'company',
  REGION = 'region',
  TEAM = 'team',
  CLIENT = 'client',
  JOB = 'job',
  INBOX = 'inbox',
}

export const SAMPLE_DATA_TAG = 'sample-data';
