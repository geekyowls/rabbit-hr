export type AtsDateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type SalaryPeriod = 'year' | 'month' | 'day' | 'hour';
export type WeekStartsOn = 0 | 1;

export const ATS_DATE_FORMATS: AtsDateFormat[] = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
];
export const SALARY_PERIODS: SalaryPeriod[] = ['year', 'month', 'day', 'hour'];

export interface AtsSettings {
  defaultCurrency: string;
  country: string;
  timezone: string;
  dateFormat: AtsDateFormat;
  locale: string;
  weekStartsOn: WeekStartsOn;
  salaryPeriodDefault: SalaryPeriod;
  departments: string[];
  portalEnabled: boolean;
  portalWelcomeMessage: string;
  brandColor: string | null;
}

export type UpdateAtsSettingsRequest = Partial<AtsSettings>;

export const DEFAULT_ATS_SETTINGS: AtsSettings = {
  defaultCurrency: 'USD',
  country: 'US',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  locale: 'en-US',
  weekStartsOn: 0,
  salaryPeriodDefault: 'year',
  departments: [],
  portalEnabled: false,
  portalWelcomeMessage: '',
  brandColor: null,
};
