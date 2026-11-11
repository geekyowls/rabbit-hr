'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { AlertCircle, CheckCircle2, FileText, Upload, X } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { formatBytes } from '@/lib/utils';
import { ApiError } from '@/utils/error-class';
import {
  useApplyToJobMutation,
  useCareersUploadUrlMutation,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CAREERS_CV_MAX_BYTES,
  type ApplyToJobRequest,
  type CareersJobDetail,
} from '@/types/careers.type';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import {
  buildCustomFieldsSchema,
  toCustomFieldFormValues,
  toCustomFieldPayload,
  type CustomFieldFormValues,
} from '@/components/custom-fields/custom-field-utils';
import { CV_MIME_TYPES, careersListHref, cvExtension } from './careers-utils';

function buildSchema(job: CareersJobDetail) {
  return z
    .object({
      firstName: z.string().trim().min(1, 'First name is required').max(100),
      lastName: z.string().trim().min(1, 'Last name is required').max(100),
      email: z.email('Please enter a valid email address'),
      phone: z.string().trim().max(40).optional(),
      location: z.string().trim().max(200).optional(),
      linkedinUrl: z
        .string()
        .trim()
        .max(300)
        .refine(
          (v) => !v || /^https?:\/\/\S+$/i.test(v),
          'Please enter a full link starting with https://',
        )
        .optional(),
      coverNote: z
        .string()
        .trim()
        .max(5000, 'Keep your note under 5,000 characters')
        .optional(),
      answers: z.array(
        z.string().max(2000, 'Keep your answer under 2,000 characters'),
      ),
      cv: z
        .instanceof(File)
        .nullable()
        .refine(
          (f) => !f || cvExtension(f.name) !== null,
          'Upload a PDF, DOC or DOCX file',
        )
        .refine(
          (f) => !f || f.size <= CAREERS_CV_MAX_BYTES,
          'Your CV must be 10 MB or smaller',
        ),
      gdprConsent: z
        .boolean()
        .refine(
          (v) => v,
          'Please confirm you agree so we can process your application',
        ),
      customFields: buildCustomFieldsSchema(job.customFields ?? []),
    })
    .superRefine((values, ctx) => {
      job.screeningQuestions.forEach((q, i) => {
        if (q.required && !values.answers[i]?.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['answers', i],
            message: 'Please answer this question',
          });
        }
      });
    });
}

type ApplyFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  coverNote?: string;
  answers: string[];
  cv: File | null;
  gdprConsent: boolean;
  customFields: CustomFieldFormValues;
};

function optional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function CareersApplyForm({
  orgSlug,
  organizationName,
  job,
}: {
  orgSlug: string;
  organizationName: string;
  job: CareersJobDetail;
}) {
  const schema = useMemo(() => buildSchema(job), [job]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const applyToJob = useApplyToJobMutation();
  const getUploadUrl = useCareersUploadUrlMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      linkedinUrl: '',
      coverNote: '',
      answers: job.screeningQuestions.map(() => ''),
      cv: null,
      gdprConsent: false,
      customFields: toCustomFieldFormValues(job.customFields ?? []),
    },
  });

  const uploadCv = async (file: File) => {
    const extension = cvExtension(file.name);
    if (!extension) throw new Error('Upload a PDF, DOC or DOCX file');
    const { signedUrl, key } = await getUploadUrl.mutateAsync({
      orgSlug,
      data: { extension, sizeBytes: file.size },
    });
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': CV_MIME_TYPES[extension] },
    });
    if (!response.ok)
      throw new Error('We could not upload your CV. Please try again.');
    return key;
  };

  const onSubmit = async (values: ApplyFormData) => {
    setFormError(null);
    try {
      const cvFileKey = values.cv ? await uploadCv(values.cv) : undefined;
      const answers = job.screeningQuestions
        .map((q, i) => ({
          questionId: q.id,
          answer: values.answers[i]?.trim() ?? '',
        }))
        .filter((a) => a.answer);
      const payload: ApplyToJobRequest = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: optional(values.phone),
        location: optional(values.location),
        linkedinUrl: optional(values.linkedinUrl),
        coverNote: optional(values.coverNote),
        answers: answers.length > 0 ? answers : undefined,
        gdprConsent: true,
        cvFileKey,
        cvFileName: values.cv && cvFileKey ? values.cv.name : undefined,
        ...(job.customFields?.length
          ? {
              customFields: toCustomFieldPayload(
                job.customFields,
                values.customFields,
              ),
            }
          : {}),
      };
      const result = await applyToJob.mutateAsync({
        orgSlug,
        jobId: job.id,
        data: payload,
      });
      setSubmitted(result.jobTitle || job.title);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setFormError(
          'You have already applied for this role with this email address. We will be in touch if your application progresses.',
        );
      } else if (err instanceof ApiError && err.statusCode === 429) {
        setFormError(
          'Too many attempts in a short time. Please wait a minute and try again.',
        );
      } else {
        setFormError(
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong. Please try again.',
        );
      }
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-border bg-card px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Application sent</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Thank you for applying for {submitted}. The {organizationName} team
          will review your application and be in touch.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={careersListHref(orgSlug)}>See more roles</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6"
      noValidate
    >
      <div>
        <h2 className="text-lg font-semibold">Apply for this role</h2>
        <p className="text-sm text-muted-foreground">
          Fields marked * are required
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="apply-first-name">First name *</Label>
          <Input
            id="apply-first-name"
            autoComplete="given-name"
            {...register('firstName')}
          />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apply-last-name">Last name *</Label>
          <Input
            id="apply-last-name"
            autoComplete="family-name"
            {...register('lastName')}
          />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="apply-email">Email *</Label>
          <Input
            id="apply-email"
            type="email"
            autoComplete="email"
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apply-phone">Phone</Label>
          <Input
            id="apply-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 010 0000"
            {...register('phone')}
          />
          <FieldError message={errors.phone?.message} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="apply-location">Location</Label>
          <Input
            id="apply-location"
            autoComplete="address-level2"
            placeholder="City or region"
            {...register('location')}
          />
          <FieldError message={errors.location?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apply-linkedin">LinkedIn</Label>
          <Input
            id="apply-linkedin"
            type="url"
            placeholder="https://linkedin.com/in/your-name"
            {...register('linkedinUrl')}
          />
          <FieldError message={errors.linkedinUrl?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>CV</Label>
        <Controller
          name="cv"
          control={control}
          render={({ field }) => (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  field.onChange(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
              {field.value ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {field.value.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(field.value.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Remove CV"
                    onClick={() => field.onChange(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-input bg-background px-4 py-5 text-center hover:bg-muted/40"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Upload your CV</span>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOC or DOCX, up to 10 MB
                  </span>
                </button>
              )}
            </div>
          )}
        />
        <FieldError message={errors.cv?.message} />
      </div>

      {job.screeningQuestions.length > 0 && (
        <div className="space-y-4">
          {job.screeningQuestions.map((q, i) => (
            <div key={q.id} className="space-y-1.5">
              <Label htmlFor={`apply-q-${q.id}`}>
                {q.question}
                {q.required && ' *'}
              </Label>
              <Textarea
                id={`apply-q-${q.id}`}
                rows={2}
                {...register(`answers.${i}`)}
              />
              <FieldError message={errors.answers?.[i]?.message} />
            </div>
          ))}
        </div>
      )}

      <CustomFieldsForm
        fields={job.customFields ?? []}
        control={control}
        className="grid-cols-1 gap-4 sm:grid-cols-2"
        labelClassName="text-sm text-foreground"
      />

      <div className="space-y-1.5">
        <Label htmlFor="apply-cover-note">Cover note</Label>
        <Textarea
          id="apply-cover-note"
          rows={4}
          placeholder="Tell us briefly why this role suits you"
          {...register('coverNote')}
        />
        <FieldError message={errors.coverNote?.message} />
      </div>

      <div className="space-y-1.5">
        <Controller
          name="gdprConsent"
          control={control}
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Checkbox
                id="apply-consent"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="apply-consent"
                className="cursor-pointer text-sm font-normal leading-snug"
              >
                I agree to {organizationName} storing and processing my personal
                data to assess my application, in line with applicable data
                protection law. *
              </Label>
            </div>
          )}
        />
        <FieldError message={errors.gdprConsent?.message} />
        <p className="text-xs text-muted-foreground">
          We only use your details for recruitment. You can ask us to access,
          correct or delete your data at any time.
        </p>
      </div>

      {formError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending application...' : 'Submit application'}
      </Button>
    </form>
  );
}
