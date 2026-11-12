'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { FileText, Upload } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import {
  useUpdatePortalProfileMutation,
  useUploadPortalDocumentMutation,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import {
  buildCustomFieldsSchema,
  toCustomFieldFormValues,
  toCustomFieldPayload,
  type CustomFieldFormValues,
} from '@/components/custom-fields/custom-field-utils';
import { usePortalSession } from '@/components/portal/portal-session';
import { PortalCard } from '@/components/portal/portal-items';
import {
  PORTAL_UPLOAD_MAX_BYTES,
  type PortalMe,
  type PortalUploadExtension,
} from '@/types/portal.type';

const CV_EXTENSIONS: PortalUploadExtension[] = ['pdf', 'doc', 'docx'];

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  headline: string;
  linkedinUrl: string;
  customFields: CustomFieldFormValues;
};

function buildSchema(me: PortalMe) {
  return z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    phone: z
      .string()
      .trim()
      .max(40)
      .refine(
        (v) => !v || /^\+?[0-9\s().-]{6,40}$/.test(v),
        'Enter a valid phone number',
      ),
    location: z.string().trim().max(200),
    headline: z.string().trim().max(250),
    linkedinUrl: z
      .string()
      .trim()
      .max(300)
      .refine(
        (v) => !v || /^https?:\/\/\S+$/i.test(v),
        'Enter a full link starting with https://',
      ),
    customFields: buildCustomFieldsSchema(me.customFields),
  });
}

function toFormValues(me: PortalMe): ProfileForm {
  const c = me.candidate;
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone ?? '',
    location: c.location ?? '',
    headline: c.headline ?? '',
    linkedinUrl: c.linkedinUrl ?? '',
    customFields: toCustomFieldFormValues(me.customFields, c.customFields),
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function CvCard({ me }: { me: PortalMe }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const upload = useUploadPortalDocumentMutation();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() as
      PortalUploadExtension | undefined;
    if (!extension || !CV_EXTENSIONS.includes(extension)) {
      toast.error('Upload a PDF or Word document');
      return;
    }
    if (file.size > PORTAL_UPLOAD_MAX_BYTES) {
      toast.error('Your CV must be 10 MB or smaller');
      return;
    }
    try {
      await upload.mutateAsync({ file, extension, data: { type: 'cv' } });
      toast.success('CV updated');
    } catch (err) {
      toast.error(
        'Could not upload your CV',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <PortalCard title="CV">
      <div className="flex items-center gap-3 p-4">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-sm">
          {me.candidate.cvFileName ?? (
            <span className="text-muted-foreground">No CV uploaded yet</span>
          )}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {upload.isPending
            ? 'Uploading...'
            : me.candidate.cvFileName
              ? 'Replace'
              : 'Upload'}
        </Button>
      </div>
    </PortalCard>
  );
}

export default function PortalProfilePage() {
  const { me, brand } = usePortalSession();
  const update = useUpdatePortalProfileMutation();
  const schema = useMemo(() => buildSchema(me), [me]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(me),
  });

  useEffect(() => {
    reset(toFormValues(me));
  }, [me, reset]);

  const onSubmit = async (values: ProfileForm) => {
    try {
      await update.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim() || null,
        location: values.location.trim() || null,
        headline: values.headline.trim() || null,
        linkedinUrl: values.linkedinUrl.trim() || null,
        ...(me.customFields.length
          ? {
              customFields: toCustomFieldPayload(
                me.customFields,
                values.customFields,
              ),
            }
          : {}),
      });
      toast.success('Profile saved');
    } catch (err) {
      toast.error(
        'Could not save your profile',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep your details up to date for the hiring team
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <PortalCard title="Contact details">
          <div className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-first-name">First name</Label>
                <Input
                  id="profile-first-name"
                  autoComplete="given-name"
                  {...register('firstName')}
                />
                <FieldError message={errors.firstName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-last-name">Last name</Label>
                <Input
                  id="profile-last-name"
                  autoComplete="family-name"
                  {...register('lastName')}
                />
                <FieldError message={errors.lastName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={me.candidate.email}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Contact the team to change your email
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  {...register('phone')}
                />
                <FieldError message={errors.phone?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-location">Location</Label>
                <Input
                  id="profile-location"
                  placeholder="City or region"
                  {...register('location')}
                />
                <FieldError message={errors.location?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-linkedin">LinkedIn</Label>
                <Input
                  id="profile-linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/your-name"
                  {...register('linkedinUrl')}
                />
                <FieldError message={errors.linkedinUrl?.message} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-headline">Headline</Label>
              <Input
                id="profile-headline"
                placeholder="For example, Registered nurse with 6 years in acute care"
                {...register('headline')}
              />
              <FieldError message={errors.headline?.message} />
            </div>
            <CustomFieldsForm
              fields={me.customFields}
              control={control}
              className="grid-cols-1 gap-4 sm:grid-cols-2"
              labelClassName="text-sm text-foreground"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="text-white hover:opacity-90"
                style={{ backgroundColor: brand }}
                disabled={isSubmitting || !isDirty}
              >
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </PortalCard>
      </form>

      <CvCard me={me} />
    </div>
  );
}
