'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import { Check, ChevronsUpDown, RotateCcw } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { DetailDrawer } from '@/components/patterns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SearchableSelect } from '@/components/common/searchable-select';
import { useSession } from '@/contexts/session-context';
import {
  useApplicationQuery,
  useApplicationsQuery,
  useCreateOfferMutation,
  useEmailTemplatesQuery,
  useJobQuery,
  useUpdateOfferMutation,
  useUserNamesQuery,
} from '@/hooks/queries';
import { useOrganizationAtsSettings } from '@/hooks/queries/use-ats-settings-query';
import { useDebounce } from '@/hooks/use-debounce';
import { useFormatters } from '@/hooks/use-formatters';
import {
  errorMessage,
  personName,
  userLabel,
  usePipelineStageMeta,
} from '@/components/applications/application-meta';
import { EMPLOYMENT_TYPE_LABEL } from '@/components/jobs/job-utils';
import {
  currencyOptions,
  SALARY_PERIOD_LABEL,
  type Formatters,
} from '@/lib/format';
import { SALARY_PERIODS, type SalaryPeriod } from '@/types/ats-settings.type';
import { EMPLOYMENT_TYPES, type EmploymentType } from '@/types/job.type';
import type { Application } from '@/types/application.type';
import type { CreateOfferRequest, Offer } from '@/types/offer.type';

const MAX_APPROVERS = 10;
const NO_TYPE = 'none';
const MERGE_FIELD_PATTERN = /\{\{\s*([a-zA-Z]+\.[a-zA-Z]+)\s*\}\}/g;
const FALLBACK_BODY =
  'Hi {{candidate.firstName}},\n\nWe are delighted to offer you the {{offer.title}} role.\n\nKind regards,\n{{recruiter.name}}\n{{organization.name}}';
const OFFER_DETAILS = [
  'Offer summary',
  'Role: {{offer.title}}',
  'Salary: {{offer.salary}}',
  'Start date: {{offer.startDate}}',
  'Please respond by: {{offer.expiresAt}}',
].join('\n');

const offerSchema = z
  .object({
    applicationId: z.string().min(1, 'Select an application'),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Keep it under 200 characters'),
    salaryAmount: z
      .string()
      .trim()
      .regex(/^(\d+(\.\d{1,2})?)?$/, 'Enter an amount, up to 2 decimals'),
    currency: z.string().length(3, 'Pick a currency'),
    salaryPeriod: z.enum(SALARY_PERIODS),
    bonus: z.string().trim().max(200, 'Keep it under 200 characters'),
    equity: z.string().trim().max(200, 'Keep it under 200 characters'),
    startDate: z.string(),
    expiresAt: z.string(),
    employmentType: z.string(),
    location: z.string().trim().max(200, 'Keep it under 200 characters'),
    approverIds: z
      .array(z.string())
      .max(MAX_APPROVERS, `Up to ${MAX_APPROVERS} approvers`),
    body: z.string(),
  })
  .refine((v) => !v.startDate || !v.expiresAt || v.expiresAt <= v.startDate, {
    path: ['expiresAt'],
    message: 'Expiry should be on or before the start date',
  });

type OfferFormValues = z.infer<typeof offerSchema>;

function emptyValues(currency: string, period: SalaryPeriod): OfferFormValues {
  return {
    applicationId: '',
    title: '',
    salaryAmount: '',
    currency,
    salaryPeriod: period,
    bonus: '',
    equity: '',
    startDate: '',
    expiresAt: '',
    employmentType: NO_TYPE,
    location: '',
    approverIds: [],
    body: '',
  };
}

function fromOffer(offer: Offer): OfferFormValues {
  return {
    applicationId: offer.applicationId,
    title: offer.title,
    salaryAmount:
      offer.salaryAmount === null ? '' : String(Number(offer.salaryAmount)),
    currency: offer.currency,
    salaryPeriod: offer.salaryPeriod,
    bonus: offer.bonus ?? '',
    equity: offer.equity ?? '',
    startDate: offer.startDate?.slice(0, 10) ?? '',
    expiresAt: offer.expiresAt?.slice(0, 10) ?? '',
    employmentType: offer.employmentType ?? NO_TYPE,
    location: offer.location ?? '',
    approverIds: offer.approverIds,
    body: offer.body ?? '',
  };
}

function toPayload(
  values: OfferFormValues,
): Omit<CreateOfferRequest, 'applicationId'> {
  const text = (v: string) => v.trim() || null;
  return {
    title: values.title.trim(),
    salaryAmount: values.salaryAmount ? Number(values.salaryAmount) : null,
    currency: values.currency,
    salaryPeriod: values.salaryPeriod,
    bonus: text(values.bonus),
    equity: text(values.equity),
    startDate: values.startDate || null,
    expiresAt: values.expiresAt || null,
    employmentType:
      values.employmentType === NO_TYPE
        ? null
        : (values.employmentType as EmploymentType),
    location: text(values.location),
    approverIds: values.approverIds,
  };
}

function renderLetter(
  template: string,
  values: OfferFormValues,
  context: Record<string, string>,
  fmt: Formatters,
) {
  const date = (v: string) =>
    v
      ? fmt.dateLong(v, { day: 'numeric', month: 'long', year: 'numeric' })
      : 'To be confirmed';
  const salary = values.salaryAmount
    ? fmt.payRate(
        Number(values.salaryAmount),
        values.salaryPeriod,
        values.currency,
      )
    : 'To be confirmed';
  const merged: Record<string, string> = {
    ...context,
    'offer.title': values.title,
    'offer.salary': salary,
    'offer.startDate': date(values.startDate),
    'offer.expiresAt': date(values.expiresAt),
    'offer.bonus': values.bonus,
    'offer.location': values.location,
  };
  const body = template.includes('{{offer.')
    ? template
    : `${template}\n\n${OFFER_DETAILS}`;
  return body.replace(MERGE_FIELD_PATTERN, (_m, key: string) =>
    key in merged ? merged[key] : '',
  );
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
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function applicationLabel(app: Application) {
  const name = personName(app.candidate) || app.candidate.email;
  return `${name}, ${app.job.title}`;
}

function ApplicationPicker({
  value,
  selected,
  onSelect,
  disabled,
}: {
  value: string;
  selected: Application | undefined;
  onSelect: (app: Application) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 500);
  const stageMeta = usePipelineStageMeta(open);
  const { data, isFetching } = useApplicationsQuery(
    {
      page: 1,
      limit: 50,
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
    },
    open,
  );
  const options = (data?.data ?? []).filter((a) => {
    const category = stageMeta.category(a.stage);
    return (
      category !== 'rejected' &&
      category !== 'withdrawn' &&
      category !== 'hired'
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-9 w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {selected
              ? applicationLabel(selected)
              : value
                ? 'Loading application'
                : 'Search candidate or job'}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search candidate or job"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isFetching ? 'Searching' : 'No active applications'}
            </CommandEmpty>
            <CommandGroup>
              {options.map((app) => (
                <CommandItem
                  key={app.id}
                  value={app.id}
                  onSelect={() => {
                    onSelect(app);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5',
                      value === app.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {personName(app.candidate) || app.candidate.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.job.title}
                      {app.job.client ? `, ${app.job.client.name}` : ''} ·{' '}
                      {stageMeta.label(app.stage)}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OfferFormDrawer({
  open,
  onOpenChange,
  offer,
  initialApplicationId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: Offer | null;
  initialApplicationId?: string | null;
  onSaved?: (offer: Offer) => void;
}) {
  const isEdit = !!offer;
  const fmt = useFormatters();
  const settings = useOrganizationAtsSettings();
  const { user, organization } = useSession();
  const { data: users = [] } = useUserNamesQuery(open);
  const { data: templates = [] } = useEmailTemplatesQuery('offer', open);
  const createOffer = useCreateOfferMutation();
  const updateOffer = useUpdateOfferMutation();
  const [picked, setPicked] = useState<Application | undefined>();

  const defaults = useMemo(
    () =>
      offer
        ? fromOffer(offer)
        : {
            ...emptyValues(fmt.currency, settings.salaryPeriodDefault),
            applicationId: initialApplicationId ?? '',
          },
    [offer, initialApplicationId, fmt.currency, settings.salaryPeriodDefault],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset(defaults);
      setPicked(undefined);
    }
  }, [open, defaults, reset]);

  const values = useWatch({ control }) as OfferFormValues;
  const applicationId = values.applicationId;
  const { data: fetchedApplication } = useApplicationQuery(
    open && applicationId && picked?.id !== applicationId
      ? applicationId
      : null,
  );
  const application =
    picked?.id === applicationId ? picked : fetchedApplication;
  const { data: job } = useJobQuery(open ? application?.jobId : null);

  useEffect(() => {
    if (isEdit || !application) return;
    if (!dirtyFields.title) setValue('title', application.job.title);
  }, [isEdit, application, dirtyFields.title, setValue]);

  useEffect(() => {
    if (isEdit || !job) return;
    if (!dirtyFields.location) setValue('location', job.location ?? '');
    if (!dirtyFields.employmentType) {
      setValue('employmentType', job.employmentType);
    }
  }, [isEdit, job, dirtyFields.location, dirtyFields.employmentType, setValue]);

  const context = useMemo((): Record<string, string> => {
    const c = application?.candidate ?? offer?.candidate;
    const recruiterName = personName({
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
    });
    return {
      'candidate.firstName': c?.firstName ?? '',
      'candidate.lastName': c?.lastName ?? '',
      'candidate.fullName': c ? `${c.firstName} ${c.lastName}`.trim() : '',
      'candidate.email': c?.email ?? '',
      'job.title': application?.job.title ?? offer?.job.title ?? '',
      'job.reference': application?.job.reference ?? offer?.job.reference ?? '',
      'job.location': job?.location ?? '',
      'client.name': application?.job.client?.name ?? offer?.client?.name ?? '',
      'recruiter.name': recruiterName || (user?.email ?? ''),
      'recruiter.firstName': user?.firstName ?? '',
      'recruiter.email': user?.email ?? '',
      'organization.name': organization?.name ?? '',
    };
  }, [application, offer, job, user, organization]);

  const template = useMemo(
    () =>
      (templates.find((t) => t.isDefault) ?? templates[0])?.body ??
      FALLBACK_BODY,
    [templates],
  );

  const preview = useMemo(
    () => (applicationId ? renderLetter(template, values, context, fmt) : ''),
    [applicationId, template, values, context, fmt],
  );

  useEffect(() => {
    if (!open || isEdit || dirtyFields.body) return;
    if (getValues('body') !== preview) setValue('body', preview);
  }, [open, isEdit, dirtyFields.body, preview, getValues, setValue]);

  const resetLetter = () =>
    setValue('body', renderLetter(template, getValues(), context, fmt), {
      shouldDirty: isEdit,
    });

  const submit = handleSubmit(async (data) => {
    const payload = toPayload(data);
    try {
      if (offer) {
        const saved = await updateOffer.mutateAsync({
          id: offer.id,
          data: { ...payload, body: data.body.trim() || null },
        });
        toast.success(
          offer.status === 'rejected' ? 'Offer revised' : 'Offer updated',
          saved.title,
        );
        onSaved?.(saved);
      } else {
        const saved = await createOffer.mutateAsync({
          applicationId: data.applicationId,
          ...payload,
          ...(dirtyFields.body && data.body.trim()
            ? { body: data.body.trim() }
            : {}),
        });
        toast.success('Offer drafted', saved.title);
        onSaved?.(saved);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error('Could not save offer', errorMessage(e));
    }
  });

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit offer' : 'New offer'}
      footer={
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {isEdit && offer?.status === 'rejected'
              ? 'Saving returns the offer to draft and clears approvals'
              : 'Saved as a draft until submitted'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create draft'}
            </Button>
          </div>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={submit}>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Candidate</h3>
          <Field label="Application" error={errors.applicationId?.message}>
            {isEdit && offer ? (
              <div className="rounded-md border border-border px-3 py-2 text-sm">
                {personName(offer.candidate) || offer.candidate.email},{' '}
                {offer.job.title}
              </div>
            ) : (
              <Controller
                name="applicationId"
                control={control}
                render={({ field }) => (
                  <ApplicationPicker
                    value={field.value}
                    selected={application}
                    onSelect={(app) => {
                      setPicked(app);
                      field.onChange(app.id);
                    }}
                  />
                )}
              />
            )}
          </Field>
          <Field label="Offer title" error={errors.title?.message}>
            <Input className="h-9" {...register('title')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Employment type">
              <Controller
                name="employmentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TYPE}>Not set</SelectItem>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {EMPLOYMENT_TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <Input className="h-9" {...register('location')} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Compensation</h3>
          <Field label="Salary" error={errors.salaryAmount?.message}>
            <div className="flex gap-2">
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={currencyOptions(field.value)}
                    searchPlaceholder="Search currency"
                    className="h-9 w-24"
                  />
                )}
              />
              <Input
                className="h-9 flex-1"
                inputMode="decimal"
                placeholder="0"
                {...register('salaryAmount')}
              />
              <Controller
                name="salaryPeriod"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 w-28">
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
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bonus" error={errors.bonus?.message}>
              <Input
                className="h-9"
                placeholder="10% annual target"
                {...register('bonus')}
              />
            </Field>
            <Field label="Equity" error={errors.equity?.message}>
              <Input
                className="h-9"
                placeholder="2,000 options"
                {...register('equity')}
              />
            </Field>
            <Field label="Start date" error={errors.startDate?.message}>
              <Input type="date" className="h-9" {...register('startDate')} />
            </Field>
            <Field label="Offer expires" error={errors.expiresAt?.message}>
              <Input type="date" className="h-9" {...register('expiresAt')} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Approvals</h3>
          <Field
            label="Approvers, all must approve"
            error={errors.approverIds?.message}
          >
            <Controller
              name="approverIds"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-1.5">
                  {users.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No team members found
                    </p>
                  )}
                  {users.map((u) => {
                    const selected = field.value.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((x) => x !== u.id)
                              : [...field.value, u.id],
                          )
                        }
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[13px]',
                          selected
                            ? 'border-[#3F6650]/40 bg-[#EDF1EE] text-[#3F6650] dark:bg-[#3F6650]/20 dark:text-[#8FBFA1]'
                            : 'border-border text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {userLabel(u)}
                        {u.id === user?.userId && ' (you)'}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            With no approvers the offer is approved as soon as it is submitted
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Offer letter</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={resetLetter}
              disabled={!applicationId}
            >
              <RotateCcw className="h-3 w-3" />
              Reset from template
            </Button>
          </div>
          <Textarea
            rows={12}
            className="font-mono text-xs"
            placeholder="Select an application to preview the letter"
            {...register('body')}
          />
          <p className="text-xs text-muted-foreground">
            Generated from your offer email template. Edit freely, the letter is
            sent to the candidate when the offer is sent.
          </p>
        </section>
      </form>
    </DetailDrawer>
  );
}
