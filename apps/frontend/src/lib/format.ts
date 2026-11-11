import {
  DEFAULT_ATS_SETTINGS,
  type AtsDateFormat,
  type AtsSettings,
  type SalaryPeriod,
} from '@/types/ats-settings.type';

export type FormatSettings = Pick<
  AtsSettings,
  'defaultCurrency' | 'locale' | 'timezone' | 'dateFormat'
>;

export type DateInput = string | Date | null | undefined;

export const PAY_UNIT_LABEL: Record<SalaryPeriod, string> = {
  hour: 'per hour',
  day: 'per day',
  month: 'per month',
  year: 'per year',
};

export const PAY_UNIT_SHORT_LABEL: Record<SalaryPeriod, string> = {
  hour: 'hr',
  day: 'day',
  month: 'mo',
  year: 'yr',
};

export const SALARY_PERIOD_LABEL: Record<SalaryPeriod, string> = {
  hour: 'Hourly',
  day: 'Daily',
  month: 'Monthly',
  year: 'Yearly',
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function browserLocale() {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return DEFAULT_ATS_SETTINGS.locale;
}

function safeLocale(locale: string | undefined) {
  if (!locale) return undefined;
  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
}

function safeTimeZone(timeZone: string | undefined, value: string | Date) {
  if (typeof value === 'string' && DATE_ONLY.test(value)) return 'UTC';
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  const date =
    typeof value === 'string' && DATE_ONLY.test(value)
      ? new Date(`${value}T00:00:00Z`)
      : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatNumber(value: number, locale?: string) {
  return new Intl.NumberFormat(safeLocale(locale)).format(value);
}

export function formatMoney(
  amount: number,
  currency: string = DEFAULT_ATS_SETTINGS.defaultCurrency,
  locale?: string,
) {
  try {
    return new Intl.NumberFormat(safeLocale(locale), {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatMoneyCompact(
  amount: number,
  currency: string = DEFAULT_ATS_SETTINGS.defaultCurrency,
  locale?: string,
) {
  if (Math.abs(amount) < 1000) return formatMoney(amount, currency, locale);
  try {
    return new Intl.NumberFormat(safeLocale(locale), {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatMoney(amount, currency, locale);
  }
}

export function formatMoneyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency?: string,
  locale?: string,
) {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (hasMin && hasMax && min !== max) {
    return `${formatMoney(min, currency, locale)} to ${formatMoney(max, currency, locale)}`;
  }
  if (hasMin) return formatMoney(min, currency, locale);
  if (hasMax) return formatMoney(max, currency, locale);
  return '';
}

export function formatPayRate(
  amount: number,
  unit: SalaryPeriod,
  currency?: string,
  locale?: string,
) {
  return `${formatMoney(amount, currency, locale)} ${PAY_UNIT_LABEL[unit]}`;
}

export interface PayFields {
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  payRate: number | null;
  rateUnit: SalaryPeriod | null;
  currency: string | null;
}

export function formatJobPay(
  job: PayFields,
  locale?: string,
  fallbackCurrency?: string,
): string {
  const currency = job.currency || fallbackCurrency;
  const isPermanent = job.employmentType === 'permanent';
  const unit = job.rateUnit ?? (isPermanent ? 'year' : 'hour');
  if (!isPermanent && job.payRate != null) {
    return formatPayRate(Number(job.payRate), unit, currency, locale);
  }
  const range = formatMoneyRange(
    job.salaryMin != null ? Number(job.salaryMin) : null,
    job.salaryMax != null ? Number(job.salaryMax) : null,
    currency,
    locale,
  );
  if (range) return `${range} ${PAY_UNIT_LABEL[unit]}`;
  if (job.payRate != null) {
    return formatPayRate(Number(job.payRate), unit, currency, locale);
  }
  return 'Not set';
}

export function formatJobPayCompact(
  job: PayFields,
  locale?: string,
  fallbackCurrency?: string,
): string {
  const currency = job.currency || fallbackCurrency;
  const isPermanent = job.employmentType === 'permanent';
  const unit = job.rateUnit ?? (isPermanent ? 'year' : 'hour');
  const suffix = ` / ${PAY_UNIT_SHORT_LABEL[unit]}`;
  const compact = (value: number) =>
    formatMoneyCompact(value, currency, locale);
  if (!isPermanent && job.payRate != null) {
    return compact(Number(job.payRate)) + suffix;
  }
  const min = job.salaryMin != null ? Number(job.salaryMin) : null;
  const max = job.salaryMax != null ? Number(job.salaryMax) : null;
  if (min != null && max != null && min !== max) {
    return `${compact(min)} - ${compact(max)}${suffix}`;
  }
  const single =
    min ?? max ?? (job.payRate != null ? Number(job.payRate) : null);
  return single != null ? compact(single) + suffix : 'Not set';
}

export function currencySymbol(currency: string, locale?: string) {
  try {
    const part = new Intl.NumberFormat(safeLocale(locale), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((p) => p.type === 'currency');
    return part?.value ?? currency;
  } catch {
    return currency;
  }
}

function numericParts(date: Date, timeZone: string | undefined) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return { year: get('year'), month: get('month'), day: get('day') };
}

const DATE_PATTERNS: Record<
  AtsDateFormat,
  (p: { year: string; month: string; day: string }) => string
> = {
  'DD/MM/YYYY': (p) => `${p.day}/${p.month}/${p.year}`,
  'MM/DD/YYYY': (p) => `${p.month}/${p.day}/${p.year}`,
  'YYYY-MM-DD': (p) => `${p.year}-${p.month}-${p.day}`,
};

export function formatDate(
  value: DateInput,
  settings: Partial<FormatSettings> = {},
) {
  const date = toDate(value);
  if (!date) return '';
  const timeZone = safeTimeZone(settings.timezone, value as string | Date);
  const pattern = DATE_PATTERNS[settings.dateFormat ?? 'YYYY-MM-DD'];
  return pattern(numericParts(date, timeZone));
}

export function formatTime(
  value: DateInput,
  settings: Partial<FormatSettings> = {},
) {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(safeLocale(settings.locale), {
    timeZone: safeTimeZone(settings.timezone, date),
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTime(
  value: DateInput,
  settings: Partial<FormatSettings> = {},
) {
  const date = formatDate(value, settings);
  return date ? `${date} ${formatTime(value, settings)}` : '';
}

export function formatDateLong(
  value: DateInput,
  settings: Partial<Pick<FormatSettings, 'locale' | 'timezone'>> = {},
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
) {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(safeLocale(settings.locale), {
    ...options,
    timeZone: safeTimeZone(settings.timezone, value as string | Date),
  }).format(date);
}

export function daysSince(value: DateInput) {
  const date = toDate(value);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

export function formatRelative(
  value: DateInput,
  settings: Partial<FormatSettings> = {},
) {
  const date = toDate(value);
  if (!date) return '';
  const days = daysSince(date);
  if (days === 0) {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(date, settings);
}

export function createFormatters(settings: AtsSettings) {
  const { defaultCurrency, locale } = settings;
  return {
    settings,
    currency: defaultCurrency,
    number: (value: number) => formatNumber(value, locale),
    money: (amount: number, currency: string = defaultCurrency) =>
      formatMoney(amount, currency, locale),
    moneyRange: (
      min: number | null | undefined,
      max: number | null | undefined,
      currency: string = defaultCurrency,
    ) => formatMoneyRange(min, max, currency, locale),
    payRate: (
      amount: number,
      unit: SalaryPeriod,
      currency: string = defaultCurrency,
    ) => formatPayRate(amount, unit, currency, locale),
    pay: (job: PayFields) => formatJobPay(job, locale, defaultCurrency),
    payCompact: (job: PayFields) =>
      formatJobPayCompact(job, locale, defaultCurrency),
    date: (value: DateInput) => formatDate(value, settings),
    dateTime: (value: DateInput) => formatDateTime(value, settings),
    time: (value: DateInput) => formatTime(value, settings),
    dateLong: (value: DateInput, options?: Intl.DateTimeFormatOptions) =>
      formatDateLong(value, settings, options),
    relative: (value: DateInput) => formatRelative(value, settings),
  };
}

export type Formatters = ReturnType<typeof createFormatters>;

export const CURRENCY_CODES = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'AUD',
  'CAD',
  'NZD',
  'SGD',
  'HKD',
  'JPY',
  'CNY',
  'KRW',
  'AED',
  'SAR',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
  'ILS',
  'TRY',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'HUF',
  'RON',
  'BGN',
  'UAH',
  'ZAR',
  'NGN',
  'KES',
  'GHS',
  'EGP',
  'MAD',
  'BRL',
  'MXN',
  'ARS',
  'CLP',
  'COP',
  'PEN',
  'IDR',
  'MYR',
  'THB',
  'PHP',
  'VND',
  'PKR',
  'BDT',
  'LKR',
  'NPR',
  'TWD',
];

export const LOCALE_CODES = [
  'en-US',
  'en-GB',
  'en-CA',
  'en-AU',
  'en-NZ',
  'en-IE',
  'en-IN',
  'en-SG',
  'en-ZA',
  'en-AE',
  'fr-FR',
  'fr-CA',
  'fr-BE',
  'fr-CH',
  'de-DE',
  'de-AT',
  'de-CH',
  'es-ES',
  'es-MX',
  'es-AR',
  'es-CO',
  'pt-BR',
  'pt-PT',
  'it-IT',
  'nl-NL',
  'nl-BE',
  'sv-SE',
  'nb-NO',
  'da-DK',
  'fi-FI',
  'pl-PL',
  'cs-CZ',
  'ro-RO',
  'hu-HU',
  'tr-TR',
  'ar-AE',
  'ar-SA',
  'he-IL',
  'hi-IN',
  'ja-JP',
  'ko-KR',
  'zh-CN',
  'zh-TW',
  'zh-HK',
  'id-ID',
  'ms-MY',
  'th-TH',
  'vi-VN',
];

const FALLBACK_TIME_ZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Istanbul',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Perth',
  'Pacific/Auckland',
];

export function timeZoneOptions(): string[] {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    return zones.includes('UTC') ? zones : ['UTC', ...zones];
  } catch {
    return FALLBACK_TIME_ZONES;
  }
}

export function currencyName(code: string, locale?: string) {
  try {
    return (
      new Intl.DisplayNames(safeLocale(locale) ?? 'en', {
        type: 'currency',
      }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

export function localeName(code: string) {
  try {
    return new Intl.DisplayNames('en', { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function currencyOptions(current?: string | null) {
  const codes =
    current && !CURRENCY_CODES.includes(current)
      ? [current, ...CURRENCY_CODES]
      : CURRENCY_CODES;
  return codes.map((code) => ({
    value: code,
    label: code,
    hint: currencyName(code),
  }));
}
