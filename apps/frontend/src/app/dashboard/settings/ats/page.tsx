'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import {
  useAtsSettingsQuery,
  useOrganizationAtsSettings,
  useUpdateAtsSettingsMutation,
} from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/contexts/session-context';
import { CountryCombobox } from '@/components/ui/country-combobox';
import { TagInputWithSuggestions } from '@/components/ui/tag-input-with-suggestions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard } from '@/components/patterns';
import { SearchableSelect } from '@/components/common/searchable-select';
import {
  LOCALE_CODES,
  SALARY_PERIOD_LABEL,
  currencyOptions,
  formatDate,
  formatMoney,
  formatTime,
  localeName,
  timeZoneOptions,
} from '@/lib/format';
import {
  ATS_DATE_FORMATS,
  SALARY_PERIODS,
  type AtsSettings,
} from '@/types/ats-settings.type';

const schema = z.object({
  defaultCurrency: z.string().regex(/^[A-Z]{3}$/, 'Choose a currency'),
  country: z.string().regex(/^[A-Z]{2}$/, 'Choose a country'),
  timezone: z.string().min(1, 'Choose a time zone'),
  dateFormat: z.enum(ATS_DATE_FORMATS),
  locale: z.string().min(2, 'Choose a locale'),
  weekStartsOn: z.enum(['0', '1']),
  salaryPeriodDefault: z.enum(SALARY_PERIODS),
  departments: z.string(),
  portalEnabled: z.boolean(),
  portalWelcomeMessage: z
    .string()
    .trim()
    .max(1000, 'Keep the message under 1,000 characters'),
  brandColor: z
    .string()
    .trim()
    .refine(
      (v) => !v || /^#[0-9a-fA-F]{6}$/.test(v),
      'Use a hex colour like #3F6650',
    ),
});

type FormValues = z.infer<typeof schema>;

const splitList = (v: string) =>
  Array.from(
    new Set(
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

function toFormValues(settings: AtsSettings): FormValues {
  return {
    defaultCurrency: settings.defaultCurrency,
    country: settings.country,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    locale: settings.locale,
    weekStartsOn: String(settings.weekStartsOn) as FormValues['weekStartsOn'],
    salaryPeriodDefault: settings.salaryPeriodDefault,
    departments: settings.departments.join(', '),
    portalEnabled: settings.portalEnabled,
    portalWelcomeMessage: settings.portalWelcomeMessage,
    brandColor: settings.brandColor ?? '',
  };
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function AtsSettingsContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Hiring preferences', active: true },
  ]);
  const sessionSettings = useOrganizationAtsSettings();
  const { data } = useAtsSettingsQuery();
  const settings = data ?? sessionSettings;
  const update = useUpdateAtsSettingsMutation();
  const { organization } = useSession();
  const portalUrl =
    organization?.slug && typeof window !== 'undefined'
      ? `${window.location.origin}/portal/login?org=${encodeURIComponent(organization.slug)}`
      : null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(settings),
  });

  useEffect(() => {
    reset(toFormValues(settings));
  }, [settings, reset]);

  const values = useWatch({ control });
  const timeZones = useMemo(
    () => timeZoneOptions().map((tz) => ({ value: tz, label: tz })),
    [],
  );
  const locales = useMemo(() => {
    const codes =
      values.locale && !LOCALE_CODES.includes(values.locale)
        ? [values.locale, ...LOCALE_CODES]
        : LOCALE_CODES;
    return codes.map((code) => ({
      value: code,
      label: localeName(code),
      hint: code,
    }));
  }, [values.locale]);

  const preview = useMemo(() => {
    const now = new Date();
    const fmtSettings = {
      locale: values.locale,
      timezone: values.timezone,
      dateFormat: values.dateFormat,
    };
    return [
      formatMoney(52500, values.defaultCurrency, values.locale),
      formatDate(now, fmtSettings),
      formatTime(now, fmtSettings),
    ].join(' · ');
  }, [
    values.defaultCurrency,
    values.locale,
    values.timezone,
    values.dateFormat,
  ]);

  const onSubmit = async (v: FormValues) => {
    try {
      await update.mutateAsync({
        defaultCurrency: v.defaultCurrency,
        country: v.country,
        timezone: v.timezone,
        dateFormat: v.dateFormat,
        locale: v.locale,
        weekStartsOn: Number(v.weekStartsOn) as AtsSettings['weekStartsOn'],
        salaryPeriodDefault: v.salaryPeriodDefault,
        departments: splitList(v.departments),
        portalEnabled: v.portalEnabled,
        portalWelcomeMessage: v.portalWelcomeMessage.trim(),
        brandColor: v.brandColor.trim() || null,
      });
      toast.success('Hiring preferences saved');
    } catch (err) {
      toast.error(
        'Could not save preferences',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <PageHeader
        title="Hiring preferences"
        description="Currency, region and formatting used across jobs, candidates and reports"
        backHref="/dashboard/settings"
        actions={
          <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
            Save changes
          </Button>
        }
      />

      <SectionCard
        title="Region and formatting"
        subtitle={`Preview: ${preview}`}
        bodyClassName="p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Default currency"
            hint="Used for new jobs, salaries and client billing"
            error={errors.defaultCurrency?.message}
          >
            <Controller
              name="defaultCurrency"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={currencyOptions(field.value)}
                  placeholder="Select currency"
                  searchPlaceholder="Search currency"
                />
              )}
            />
          </Field>
          <Field label="Country" error={errors.country?.message}>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <CountryCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          </Field>
          <Field label="Time zone" error={errors.timezone?.message}>
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={timeZones}
                  placeholder="Select time zone"
                  searchPlaceholder="Search time zone"
                />
              )}
            />
          </Field>
          <Field
            label="Number format"
            hint="Affects numbers and currency only, interface language support comes later"
            error={errors.locale?.message}
          >
            <Controller
              name="locale"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={locales}
                  placeholder="Select locale"
                  searchPlaceholder="Search locale"
                />
              )}
            />
          </Field>
          <Field label="Date format">
            <Controller
              name="dateFormat"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATS_DATE_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Week starts on">
            <Controller
              name="weekStartsOn"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Default salary period">
            <Controller
              name="salaryPeriodDefault"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALARY_PERIODS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {SALARY_PERIOD_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Candidate portal"
        subtitle="Let candidates sign in with an email code to track applications, interviews, offers and documents"
        bodyClassName="p-4"
        actions={
          <Controller
            name="portalEnabled"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Enable candidate portal"
                />
                {field.value ? 'On' : 'Off'}
              </label>
            )}
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <Field
            label="Welcome message"
            hint="Shown on the portal home page and in invite emails"
            error={errors.portalWelcomeMessage?.message}
          >
            <Controller
              name="portalWelcomeMessage"
              control={control}
              render={({ field }) => (
                <Textarea
                  rows={3}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Welcome to your candidate portal"
                />
              )}
            />
          </Field>
          <Field
            label="Brand colour"
            hint="Used for buttons and highlights in the portal"
            error={errors.brandColor?.message}
          >
            <Controller
              name="brandColor"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick brand colour"
                    value={field.value || '#3F6650'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                  />
                  <Input
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="#3F6650"
                    className="h-9"
                  />
                </div>
              )}
            />
          </Field>
        </div>
        {portalUrl && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            <span className="shrink-0">Portal link</span>
            <code className="min-w-0 flex-1 truncate text-foreground">
              {portalUrl}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                void navigator.clipboard.writeText(portalUrl);
                toast.success('Link copied');
              }}
            >
              Copy
            </Button>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Departments"
        subtitle="Offered when creating jobs and used to filter the jobs list"
        bodyClassName="p-4"
      >
        <Controller
          name="departments"
          control={control}
          render={({ field }) => (
            <TagInputWithSuggestions
              value={field.value}
              onChange={field.onChange}
              suggestions={[]}
              placeholder="Add a department"
            />
          )}
        />
      </SectionCard>
    </form>
  );
}

export default function AtsSettingsPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.ATS_SETTINGS_MANAGE}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to manage hiring preferences
        </div>
      }
    >
      <AtsSettingsContent />
    </PermissionGuard>
  );
}
