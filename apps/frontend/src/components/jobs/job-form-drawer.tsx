'use client';

import { useEffect, useMemo, useState } from 'react';
import { useResetOnKey } from '@/hooks/use-reset-on-key';
import {
  useForm,
  useFieldArray,
  Controller,
  type Control,
  type FieldPath,
} from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import { DetailDrawer } from '@/components/patterns';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchableSelect } from '@/components/common/searchable-select';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import {
  buildCustomFieldsSchema,
  mergeCustomFieldDefaults,
  toCustomFieldFormValues,
  toCustomFieldPayload,
  type CustomFieldFormValues,
  type CustomFieldLike,
} from '@/components/custom-fields/custom-field-utils';
import { userLabel } from '@/components/applications/application-meta';
import { useOrganizationAtsSettings } from '@/hooks/queries/use-ats-settings-query';
import { currencyOptions, currencySymbol } from '@/lib/format';
import type { AtsSettings } from '@/types/ats-settings.type';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useClientsQuery,
  useCreateJobMutation,
  useCustomFieldsQuery,
  useUpdateJobMutation,
  useUserNamesQuery,
} from '@/hooks/queries';
import { toast } from '@/lib/toast';
import {
  EMPLOYMENT_TYPES,
  RATE_UNITS,
  WORK_MODES,
  type CreateJobRequest,
  type JobDetail,
  type RateUnit,
} from '@/types/job.type';
import {
  EMPLOYMENT_TYPE_LABEL,
  RATE_UNIT_LABEL,
  WORK_MODE_LABEL,
  errorMessage,
} from './job-utils';

const NONE = 'none';
const amount = z
  .string()
  .trim()
  .regex(/^(\d+(\.\d{1,2})?)?$/, 'Enter an amount');

const baseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Too long'),
  clientId: z.string(),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  location: z.string().trim().max(200, 'Too long'),
  openings: z.string().regex(/^[1-9]\d*$/, 'Enter a number'),
  rateUnit: z.enum(RATE_UNITS),
  salaryMin: amount,
  salaryMax: amount,
  payRate: amount,
  chargeRate: amount,
  closingDate: z.string(),
  status: z.enum(['draft', 'published']),
  description: z.string(),
  requirements: z.string(),
  skills: z.string(),
  requiredDocuments: z.string(),
  screeningQuestions: z.array(
    z.object({
      id: z.string().optional(),
      question: z
        .string()
        .trim()
        .min(1, 'Enter a question')
        .max(500, 'Too long'),
      required: z.boolean(),
    }),
  ),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Choose a currency'),
  department: z.string().trim().max(100, 'Too long'),
  hiringManagerId: z.string(),
  recruiterId: z.string(),
  hiringTeamIds: z.array(z.string()),
});

function buildSchema(customFields: CustomFieldLike[]) {
  return baseSchema
    .extend({ customFields: buildCustomFieldsSchema(customFields) })
    .refine(
      (v) =>
        !v.salaryMin ||
        !v.salaryMax ||
        Number(v.salaryMin) <= Number(v.salaryMax),
      { path: ['salaryMax'], message: 'Must be at least the minimum' },
    );
}

export type JobFormValues = z.infer<typeof baseSchema> & {
  customFields: CustomFieldFormValues;
};

const JOB_FORM_DEFAULTS: JobFormValues = {
  title: '',
  clientId: NONE,
  employmentType: 'permanent',
  workMode: 'onsite',
  location: '',
  openings: '1',
  rateUnit: 'year',
  salaryMin: '',
  salaryMax: '',
  payRate: '',
  chargeRate: '',
  closingDate: '',
  status: 'draft',
  description: '',
  requirements: '',
  skills: '',
  requiredDocuments: '',
  screeningQuestions: [],
  currency: '',
  department: '',
  hiringManagerId: NONE,
  recruiterId: NONE,
  hiringTeamIds: [],
  customFields: {},
};

function defaultRateUnit(settings: AtsSettings): RateUnit {
  const period = settings.salaryPeriodDefault;
  return (RATE_UNITS as string[]).includes(period)
    ? (period as RateUnit)
    : 'year';
}

function newJobValues(
  settings: AtsSettings,
  customFields: CustomFieldLike[],
  clientId: string,
): JobFormValues {
  return {
    ...JOB_FORM_DEFAULTS,
    clientId,
    currency: settings.defaultCurrency,
    rateUnit: defaultRateUnit(settings),
    customFields: toCustomFieldFormValues(customFields),
  };
}

const str = (v: number | string | null | undefined) =>
  v === null || v === undefined ? '' : String(v);

function toFormValues(
  job: JobDetail,
  settings: AtsSettings,
  customFields: CustomFieldLike[],
): JobFormValues {
  return {
    ...JOB_FORM_DEFAULTS,
    title: job.title,
    clientId: job.clientId ?? NONE,
    employmentType: job.employmentType,
    workMode: job.workMode,
    location: job.location ?? '',
    openings: String(job.openings ?? 1),
    rateUnit:
      job.rateUnit ?? (job.employmentType === 'permanent' ? 'year' : 'hour'),
    salaryMin: str(job.salaryMin),
    salaryMax: str(job.salaryMax),
    payRate: str(job.payRate),
    chargeRate: str(job.chargeRate),
    closingDate: job.closingDate ? job.closingDate.slice(0, 10) : '',
    status: job.status === 'published' ? 'published' : 'draft',
    description: job.description ?? '',
    requirements: job.requirements ?? '',
    skills: job.skills.join(', '),
    requiredDocuments: job.requiredDocuments.join(', '),
    screeningQuestions: job.screeningQuestions.map((q) => ({ ...q })),
    currency: job.currency || settings.defaultCurrency,
    department: job.department ?? '',
    hiringManagerId: job.hiringManagerId ?? NONE,
    recruiterId: job.recruiterId ?? NONE,
    hiringTeamIds: job.hiringTeamIds ?? [],
    customFields: toCustomFieldFormValues(customFields, job.customFields),
  };
}

const toNumber = (v: string) => (v ? Number(v) : null);
const toList = (v: string) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const optionalId = (v: string) => (v === NONE ? null : v);

function toRequest(
  values: JobFormValues,
  isEdit: boolean,
  customFields: CustomFieldLike[],
): CreateJobRequest {
  const isPermanent = values.employmentType === 'permanent';
  return {
    title: values.title,
    clientId: values.clientId === NONE ? null : values.clientId,
    employmentType: values.employmentType,
    workMode: values.workMode,
    location: values.location || null,
    openings: Number(values.openings),
    rateUnit: values.rateUnit,
    currency: values.currency,
    salaryMin: isPermanent ? toNumber(values.salaryMin) : null,
    salaryMax: isPermanent ? toNumber(values.salaryMax) : null,
    payRate: isPermanent ? null : toNumber(values.payRate),
    chargeRate: isPermanent ? null : toNumber(values.chargeRate),
    closingDate: values.closingDate || null,
    description: values.description.trim() || null,
    requirements: values.requirements.trim() || null,
    skills: toList(values.skills),
    requiredDocuments: toList(values.requiredDocuments),
    screeningQuestions: values.screeningQuestions,
    department: values.department.trim() || null,
    hiringManagerId: optionalId(values.hiringManagerId),
    recruiterId: optionalId(values.recruiterId),
    hiringTeamIds: values.hiringTeamIds,
    customFields: toCustomFieldPayload(customFields, values.customFields),
    ...(isEdit ? {} : { status: values.status }),
  };
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function SelectField({
  name,
  control,
  options,
  placeholder,
}: {
  name: FieldPath<JobFormValues>;
  control: Control<JobFormValues>;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          value={(field.value as string) || undefined}
          onValueChange={field.onChange}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

const OTHER = '__other__';

function DepartmentField({
  control,
  departments,
}: {
  control: Control<JobFormValues>;
  departments: string[];
}) {
  const [custom, setCustom] = useState(false);
  return (
    <Controller
      name="department"
      control={control}
      render={({ field }) => {
        const known = !field.value || departments.includes(field.value);
        if (departments.length === 0 || custom || !known) {
          return (
            <div className="flex gap-1.5">
              <Input
                className="h-9"
                placeholder="Department"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
              {departments.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setCustom(false);
                    field.onChange('');
                  }}
                >
                  List
                </Button>
              )}
            </div>
          );
        }
        return (
          <Select
            value={field.value || NONE}
            onValueChange={(v) => {
              if (v === OTHER) {
                setCustom(true);
                field.onChange('');
                return;
              }
              field.onChange(v === NONE ? '' : v);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No department</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
              <SelectItem value={OTHER}>Other</SelectItem>
            </SelectContent>
          </Select>
        );
      }}
    />
  );
}

export function JobFormDrawer({
  open,
  onOpenChange,
  job,
  defaultClientId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobDetail | null;
  defaultClientId?: string | null;
  onSaved?: (job: JobDetail) => void;
}) {
  const isEdit = !!job;
  const settings = useOrganizationAtsSettings();
  const { data: fieldDefs } = useCustomFieldsQuery(
    { entity: 'job', activeOnly: true },
    open,
  );
  const customFields = useMemo(() => fieldDefs ?? [], [fieldDefs]);
  const schema = useMemo(() => buildSchema(customFields), [customFields]);
  const { data: users = [] } = useUserNamesQuery(open);
  const createJob = useCreateJobMutation();
  const updateJob = useUpdateJobMutation();
  const { data: clientsData } = useClientsQuery(
    { page: 1, limit: 100, status: 'active' },
    open,
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(schema),
    defaultValues: JOB_FORM_DEFAULTS,
  });

  const questions = useFieldArray({ control, name: 'screeningQuestions' });
  const employmentType = watch('employmentType');
  const currency = watch('currency') || settings.defaultCurrency;
  const isPermanent = employmentType === 'permanent';
  const symbol = currencySymbol(currency, settings.locale);

  useResetOnKey(
    open ? `${job?.id ?? 'new'}:${defaultClientId ?? ''}` : null,
    () =>
      reset(
        job
          ? toFormValues(job, settings, customFields)
          : newJobValues(settings, customFields, defaultClientId ?? NONE),
      ),
  );

  useEffect(() => {
    if (!open) return;
    const merged = mergeCustomFieldDefaults(
      customFields,
      getValues('customFields'),
      job?.customFields,
    );
    if (merged) setValue('customFields', merged);
  }, [open, customFields, job, getValues, setValue]);

  const userOptions = users.map((u) => ({
    label: userLabel(u),
    value: u.id,
  }));
  const personOptions = [{ label: 'Unassigned', value: NONE }, ...userOptions];

  const clientOptions = [
    { label: 'No client', value: NONE },
    ...(clientsData?.data ?? []).map((c) => ({ label: c.name, value: c.id })),
    ...(job?.client &&
    !(clientsData?.data ?? []).some((c) => c.id === job.client?.id)
      ? [{ label: job.client.name, value: job.client.id }]
      : []),
  ];

  const submit = handleSubmit(async (values) => {
    try {
      const data = toRequest(values, isEdit, customFields);
      const saved = job
        ? await updateJob.mutateAsync({ id: job.id, data })
        : await createJob.mutateAsync(data);
      toast.success(isEdit ? 'Job updated' : 'Job created', saved.title);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      toast.error(
        isEdit ? 'Could not update job' : 'Could not create job',
        errorMessage(e),
      );
    }
  });

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit job' : 'New job'}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create job'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={submit}>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Role</h3>
          <Field label="Job title" error={errors.title?.message}>
            <Input
              className="h-9"
              placeholder="Warehouse operative"
              {...register('title')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client">
              <SelectField
                name="clientId"
                control={control}
                options={clientOptions}
                placeholder="Select client"
              />
            </Field>
            <Field label="Department" error={errors.department?.message}>
              <DepartmentField
                control={control}
                departments={settings.departments}
              />
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <Input
                className="h-9"
                placeholder="City or region"
                {...register('location')}
              />
            </Field>
            <Field label="Work mode">
              <SelectField
                name="workMode"
                control={control}
                options={WORK_MODES.map((m) => ({
                  label: WORK_MODE_LABEL[m],
                  value: m,
                }))}
              />
            </Field>
            <Field label="Employment type">
              <SelectField
                name="employmentType"
                control={control}
                options={EMPLOYMENT_TYPES.map((t) => ({
                  label: EMPLOYMENT_TYPE_LABEL[t],
                  value: t,
                }))}
              />
            </Field>
            <Field label="Openings" error={errors.openings?.message}>
              <Input
                className="h-9"
                inputMode="numeric"
                {...register('openings')}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Hiring team</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hiring manager">
              <SelectField
                name="hiringManagerId"
                control={control}
                options={personOptions}
                placeholder="Select person"
              />
            </Field>
            <Field label="Recruiter">
              <SelectField
                name="recruiterId"
                control={control}
                options={personOptions}
                placeholder="Select person"
              />
            </Field>
          </div>
          <Field label="Hiring team">
            <Controller
              name="hiringTeamIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={userOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add team members"
                />
              )}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Compensation and status</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency" error={errors.currency?.message}>
              <Controller
                name="currency"
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
            <Field label="Rate unit">
              <SelectField
                name="rateUnit"
                control={control}
                options={RATE_UNITS.map((u) => ({
                  label: RATE_UNIT_LABEL[u],
                  value: u,
                }))}
              />
            </Field>
            {isPermanent ? (
              <>
                <Field
                  label={`Salary from (${symbol})`}
                  error={errors.salaryMin?.message}
                >
                  <Input
                    className="h-9"
                    inputMode="decimal"
                    placeholder="28000"
                    {...register('salaryMin')}
                  />
                </Field>
                <Field
                  label={`Salary to (${symbol})`}
                  error={errors.salaryMax?.message}
                >
                  <Input
                    className="h-9"
                    inputMode="decimal"
                    placeholder="34000"
                    {...register('salaryMax')}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field
                  label={`Pay rate (${symbol})`}
                  error={errors.payRate?.message}
                >
                  <Input
                    className="h-9"
                    inputMode="decimal"
                    placeholder="12.50"
                    {...register('payRate')}
                  />
                </Field>
                <Field
                  label={`Charge rate (${symbol})`}
                  error={errors.chargeRate?.message}
                >
                  <Input
                    className="h-9"
                    inputMode="decimal"
                    placeholder="16.80"
                    {...register('chargeRate')}
                  />
                </Field>
              </>
            )}
            <Field label="Closing date">
              <Input type="date" className="h-9" {...register('closingDate')} />
            </Field>
          </div>
          {!isEdit && (
            <Field label="Status">
              <SelectField
                name="status"
                control={control}
                options={[
                  { label: 'Draft', value: 'draft' },
                  { label: 'Published', value: 'published' },
                ]}
              />
            </Field>
          )}
        </section>

        {customFields.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Additional details</h3>
            <CustomFieldsForm fields={customFields} control={control} />
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Description</h3>
          <Field label="Job description">
            <Textarea
              rows={4}
              placeholder="What the role involves and who it works with"
              {...register('description')}
            />
          </Field>
          <Field label="Requirements">
            <Textarea
              rows={3}
              placeholder="Experience, certifications, shift patterns"
              {...register('requirements')}
            />
          </Field>
          <Field label="Skills, comma separated">
            <Input
              className="h-9"
              placeholder="Forklift, Picking, Packing"
              {...register('skills')}
            />
          </Field>
          <Field label="Required documents, comma separated">
            <Input
              className="h-9"
              placeholder="Right to work, CV, Background check"
              {...register('requiredDocuments')}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Screening questions</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              onClick={() =>
                questions.append({ question: '', required: false })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add question
            </Button>
          </div>
          {questions.fields.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No screening questions
            </p>
          )}
          {questions.fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-2 rounded-md border border-border p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    className="h-9"
                    placeholder="Do you hold a valid driving licence?"
                    {...register(`screeningQuestions.${index}.question`)}
                  />
                  {errors.screeningQuestions?.[index]?.question?.message && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.screeningQuestions[index]?.question?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => questions.remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove question</span>
                </Button>
              </div>
              <Controller
                name={`screeningQuestions.${index}.required`}
                control={control}
                render={({ field: f }) => (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={f.value} onCheckedChange={f.onChange} />
                    Required
                  </label>
                )}
              />
            </div>
          ))}
        </section>
      </form>
    </DetailDrawer>
  );
}
