'use client';

import { useEffect, useMemo } from 'react';
import { useResetOnKey } from '@/hooks/use-reset-on-key';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { z } from 'zod/v4';
import { FileText, Upload, X } from 'lucide-react';
import { DetailDrawer, RatingStars } from '@/components/patterns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { formatBytes } from '@/lib/utils';
import { ApiError } from '@/utils/error-class';
import {
  useCreateActivityMutation,
  useCreateApplicationMutation,
  useCreateCandidateDocumentMutation,
  useCreateCandidateMutation,
  useCustomFieldsQuery,
  useUpdateCandidateMutation,
} from '@/hooks/queries';
import { useFormatters } from '@/hooks/use-formatters';
import { currencySymbol } from '@/lib/format';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import {
  buildCustomFieldsSchema,
  mergeCustomFieldDefaults,
  toCustomFieldFormValues,
  toCustomFieldPayload,
  type CustomFieldFormValues,
  type CustomFieldLike,
} from '@/components/custom-fields/custom-field-utils';
import {
  CANDIDATE_SOURCES,
  RIGHT_TO_WORK_OPTIONS,
  type CandidateDetail,
  type CreateCandidateRequest,
} from '@/types/candidate.type';
import {
  RIGHT_TO_WORK_LABEL,
  SOURCE_LABEL,
  UPLOAD_ACCEPT,
  usePipelineStageMeta,
  errorMessage,
  uploadDocumentFile,
} from '@/components/applications/application-meta';
import { usePublishedJobs } from '@/components/applications/add-to-job-dialog';

const NO_JOB = 'none';
const PHONE = /^\+?\d{6,15}$/;
const LINKEDIN_URL = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i;

const cleanPhone = (v: string) => v.replace(/[\s().-]/g, '');
const cleanAmount = (v: string) => v.replace(/[^\d.]/g, '');

const candidateSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => !v || PHONE.test(cleanPhone(v)),
      'Enter a phone number, for example +1 555 010 0000',
    ),
  location: z.string().trim().max(200),
  headline: z.string().trim().max(250),
  currentTitle: z.string().trim().max(150),
  currentEmployer: z.string().trim().max(150),
  yearsExperience: z
    .string()
    .trim()
    .refine(
      (v) => !v || (/^\d+$/.test(v) && Number(v) <= 70),
      'Enter whole years',
    ),
  skills: z.string(),
  tags: z.string(),
  source: z.enum(CANDIDATE_SOURCES),
  rightToWork: z.enum(RIGHT_TO_WORK_OPTIONS),
  noticePeriod: z.string().trim().max(100),
  expectedSalary: z
    .string()
    .trim()
    .refine(
      (v) => !v || /^\d+(\.\d{1,2})?$/.test(cleanAmount(v)),
      'Enter an amount',
    ),
  linkedinUrl: z
    .string()
    .trim()
    .refine((v) => !v || LINKEDIN_URL.test(v), 'Enter a LinkedIn profile URL'),
  rating: z.number().min(0).max(5),
  jobId: z.string(),
  stage: z.string().min(1),
  notes: z.string().trim().max(5000),
  cv: z.custom<File | null>((v) => v === null || v instanceof File),
});

type CandidateFormData = z.infer<typeof candidateSchema> & {
  customFields: CustomFieldFormValues;
};

const DEFAULTS: CandidateFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  headline: '',
  currentTitle: '',
  currentEmployer: '',
  yearsExperience: '',
  skills: '',
  tags: '',
  source: 'other',
  rightToWork: 'unknown',
  noticePeriod: '',
  expectedSalary: '',
  linkedinUrl: '',
  rating: 0,
  jobId: NO_JOB,
  stage: 'applied',
  notes: '',
  cv: null,
  customFields: {},
};

function toFormValues(
  c: CandidateDetail,
  customFields: CustomFieldLike[],
): CandidateFormData {
  return {
    ...DEFAULTS,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone ?? '',
    location: c.location ?? '',
    headline: c.headline ?? '',
    currentTitle: c.currentTitle ?? '',
    currentEmployer: c.currentEmployer ?? '',
    yearsExperience:
      c.yearsExperience !== null ? String(c.yearsExperience) : '',
    skills: c.skills.join(', '),
    tags: c.tags.join(', '),
    source: c.source,
    rightToWork: c.rightToWork,
    noticePeriod: c.noticePeriod ?? '',
    expectedSalary: c.expectedSalary !== null ? String(c.expectedSalary) : '',
    linkedinUrl: c.linkedinUrl ?? '',
    rating: c.rating ?? 0,
    customFields: toCustomFieldFormValues(customFields, c.customFields),
  };
}

const splitList = (v: string) =>
  Array.from(
    new Set(
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

const orNull = (v: string) => (v ? v : null);

function toPayload(
  data: CandidateFormData,
  customFields: CustomFieldLike[],
): CreateCandidateRequest {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone ? cleanPhone(data.phone) : null,
    location: orNull(data.location),
    headline: orNull(data.headline),
    currentTitle: orNull(data.currentTitle),
    currentEmployer: orNull(data.currentEmployer),
    yearsExperience: data.yearsExperience ? Number(data.yearsExperience) : null,
    skills: splitList(data.skills),
    tags: splitList(data.tags),
    source: data.source,
    rightToWork: data.rightToWork,
    noticePeriod: orNull(data.noticePeriod),
    expectedSalary: data.expectedSalary
      ? Number(cleanAmount(data.expectedSalary))
      : null,
    linkedinUrl: orNull(data.linkedinUrl),
    rating: data.rating > 0 ? data.rating : null,
    customFields: toCustomFieldPayload(customFields, data.customFields),
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AddCandidateDrawer({
  open,
  onOpenChange,
  candidate,
  defaultJobId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate?: CandidateDetail | null;
  defaultJobId?: string;
  onSaved?: (candidate: CandidateDetail) => void;
}) {
  const isEdit = !!candidate;
  const createCandidate = useCreateCandidateMutation();
  const updateCandidate = useUpdateCandidateMutation();
  const createDocument = useCreateCandidateDocumentMutation();
  const createApplication = useCreateApplicationMutation();
  const createActivity = useCreateActivityMutation();
  const { data: jobsData } = usePublishedJobs(open && !isEdit);
  const jobs = jobsData?.data ?? [];
  const stageMeta = usePipelineStageMeta(open && !isEdit);
  const fmt = useFormatters();
  const { data: fieldDefs } = useCustomFieldsQuery(
    { entity: 'candidate', activeOnly: true },
    open,
  );
  const customFields = useMemo(() => fieldDefs ?? [], [fieldDefs]);
  const schema = useMemo(
    () =>
      candidateSchema.extend({
        customFields: buildCustomFieldsSchema(customFields),
      }),
    [customFields],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const [cv, jobId] = useWatch({ control, name: ['cv', 'jobId'] });

  useResetOnKey(
    open ? `${candidate?.id ?? 'new'}:${defaultJobId ?? ''}` : null,
    () =>
      reset(
        candidate
          ? toFormValues(candidate, customFields)
          : {
              ...DEFAULTS,
              jobId: defaultJobId ?? NO_JOB,
              customFields: toCustomFieldFormValues(customFields),
            },
      ),
  );

  useEffect(() => {
    if (!open) return;
    const merged = mergeCustomFieldDefaults(
      customFields,
      getValues('customFields'),
      candidate?.customFields,
    );
    if (merged) setValue('customFields', merged);
  }, [open, customFields, candidate, getValues, setValue]);

  const attachCv = async (candidateId: string, file: File) => {
    try {
      const uploaded = await uploadDocumentFile(file);
      await updateCandidate.mutateAsync({
        id: candidateId,
        data: { cvFileKey: uploaded.key, cvFileName: uploaded.fileName },
      });
      await createDocument.mutateAsync({
        candidateId,
        data: {
          type: 'cv',
          name: uploaded.fileName,
          fileKey: uploaded.key,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
        },
      });
    } catch (err) {
      toast.error('CV was not uploaded', errorMessage(err));
    }
  };

  const save = async (data: CandidateFormData) => {
    const payload = toPayload(data, customFields);
    if (candidate) {
      const updated = await updateCandidate.mutateAsync({
        id: candidate.id,
        data: payload,
      });
      if (data.cv) await attachCv(updated.id, data.cv);
      toast.success('Candidate updated');
      onSaved?.(updated);
      return true;
    }

    const created = await createCandidate.mutateAsync(payload);
    if (data.cv) await attachCv(created.id, data.cv);
    if (data.jobId !== NO_JOB) {
      try {
        await createApplication.mutateAsync({
          candidateId: created.id,
          jobId: data.jobId,
          stage: data.stage,
          source: data.source,
        });
      } catch (err) {
        toast.error('Not added to the job', errorMessage(err));
      }
    }
    if (data.notes) {
      try {
        await createActivity.mutateAsync({
          candidateId: created.id,
          type: 'note',
          body: data.notes,
        });
      } catch (err) {
        toast.error('Note was not saved', errorMessage(err));
      }
    }
    toast.success(`${created.firstName} ${created.lastName} added`);
    onSaved?.(created);
    return true;
  };

  const submit = (addAnother: boolean) =>
    handleSubmit(async (data) => {
      try {
        await save(data);
        if (addAnother && !isEdit) {
          reset({
            ...DEFAULTS,
            jobId: data.jobId,
            source: data.source,
            customFields: toCustomFieldFormValues(customFields),
          });
        } else {
          onOpenChange(false);
        }
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 409) {
          setError('email', {
            message: 'A candidate with this email already exists',
          });
          toast.error(
            'Duplicate candidate',
            'A candidate with this email already exists. Search for them instead',
          );
          return;
        }
        toast.error(
          isEdit ? 'Could not update candidate' : 'Could not add candidate',
          errorMessage(err),
        );
      }
    });

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit candidate' : 'Add candidate'}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {!isEdit && (
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={submit(true)}
            >
              Save & add another
            </Button>
          )}
          <Button size="sm" disabled={isSubmitting} onClick={submit(false)}>
            {isSubmitting
              ? 'Saving...'
              : isEdit
                ? 'Save changes'
                : 'Add candidate'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={submit(false)}>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Basics</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName?.message}>
              <Input
                className="h-9"
                placeholder="Amelia"
                {...register('firstName')}
              />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <Input
                className="h-9"
                placeholder="Hughes"
                {...register('lastName')}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" error={errors.email?.message}>
              <Input
                className="h-9"
                type="email"
                placeholder="amelia@example.com"
                {...register('email')}
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input
                className="h-9"
                placeholder="+1 555 010 0000"
                {...register('phone')}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" error={errors.location?.message}>
              <Input
                className="h-9"
                placeholder="City or region"
                {...register('location')}
              />
            </Field>
            <Field label="LinkedIn" error={errors.linkedinUrl?.message}>
              <Input
                className="h-9"
                placeholder="https://linkedin.com/in/..."
                {...register('linkedinUrl')}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Experience</h3>
          <Field label="Headline" error={errors.headline?.message}>
            <Input
              className="h-9"
              placeholder="Experienced senior carer"
              {...register('headline')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current title" error={errors.currentTitle?.message}>
              <Input
                className="h-9"
                placeholder="Senior care assistant"
                {...register('currentTitle')}
              />
            </Field>
            <Field
              label="Current employer"
              error={errors.currentEmployer?.message}
            >
              <Input
                className="h-9"
                placeholder="Bupa"
                {...register('currentEmployer')}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Years of experience"
              error={errors.yearsExperience?.message}
            >
              <Input
                className="h-9"
                inputMode="numeric"
                placeholder="5"
                {...register('yearsExperience')}
              />
            </Field>
            <Field label="Notice period" error={errors.noticePeriod?.message}>
              <Input
                className="h-9"
                placeholder="1 month"
                {...register('noticePeriod')}
              />
            </Field>
          </div>
          <Field label="Skills, comma separated">
            <Input
              className="h-9"
              placeholder="Dementia care, Medication, NVQ Level 3"
              {...register('skills')}
            />
          </Field>
          <Field label="Tags, comma separated">
            <Input
              className="h-9"
              placeholder="Night shifts, Driver"
              {...register('tags')}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Eligibility and pay</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Work eligibility">
              <Controller
                name="rightToWork"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RIGHT_TO_WORK_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {RIGHT_TO_WORK_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label={`Expected salary (${fmt.currency})`}
              error={errors.expectedSalary?.message}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currencySymbol(fmt.currency, fmt.settings.locale)}
                </span>
                <Input
                  className="h-9 pl-8"
                  inputMode="decimal"
                  placeholder="32,000"
                  {...register('expectedSalary')}
                />
              </div>
            </Field>
          </div>
          <Field label="Source">
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Where did they come from?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANDIDATE_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SOURCE_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </section>

        {!isEdit && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Add to job</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Job">
                <Controller
                  name="jobId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_JOB}>
                          Do not add to a job
                        </SelectItem>
                        {jobs.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.title}
                            {j.client ? `, ${j.client.name}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Stage">
                <Controller
                  name="stage"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={jobId === NO_JOB}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stageMeta.flowStages.map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            {isEdit && candidate?.cvFileName ? 'Replace CV' : 'CV'}
          </h3>
          {cv ? (
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{cv.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(cv.size, 1)}
              </span>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => setValue('cv', null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-6 text-center hover:bg-accent">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isEdit && candidate?.cvFileName
                  ? `Current: ${candidate.cvFileName}`
                  : 'Drop a file or click to upload'}
              </span>
              <span className="text-xs text-muted-foreground">
                PDF, DOC or DOCX up to 10MB
              </span>
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  setValue('cv', e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </section>

        {customFields.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Additional details</h3>
            <CustomFieldsForm fields={customFields} control={control} />
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Assessment</h3>
          <Field label="Rating">
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <RatingStars value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
          {!isEdit && (
            <Field label="Notes" error={errors.notes?.message}>
              <Textarea
                rows={3}
                placeholder="First impressions, context, next steps"
                {...register('notes')}
              />
            </Field>
          )}
        </section>
      </form>
    </DetailDrawer>
  );
}
