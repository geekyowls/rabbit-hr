'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
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
  useCreateClientMutation,
  useUpdateClientMutation,
} from '@/hooks/queries';
import { toast } from '@/lib/toast';
import { errorMessage } from '@/components/jobs/job-utils';
import type {
  ClientDetail,
  ClientListItem,
  CreateClientRequest,
} from '@/types/client.type';

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const CURRENCIES = ['GBP', 'EUR', 'USD'];
const PAYMENT_TERMS = [
  'Due on receipt',
  '7 days',
  '14 days',
  '30 days',
  '60 days',
];

const optionalEmail = z
  .string()
  .trim()
  .refine((v) => !v || z.email().safeParse(v).success, 'Enter a valid email');

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Too long'),
  legalName: z.string().trim().max(200, 'Too long'),
  industry: z.string().trim().max(120, 'Too long'),
  website: z.string().trim().max(300, 'Too long'),
  phone: z.string().trim().max(40, 'Too long'),
  email: optionalEmail,
  street: z.string().trim().max(200, 'Too long'),
  city: z.string().trim().max(100, 'Too long'),
  county: z.string().trim().max(100, 'Too long'),
  postcode: z
    .string()
    .trim()
    .refine((v) => !v || UK_POSTCODE.test(v), 'Enter a valid UK postcode'),
  country: z.string().trim().max(100, 'Too long'),
  billingContactName: z.string().trim().max(150, 'Too long'),
  billingEmail: optionalEmail,
  billingPhone: z.string().trim().max(40, 'Too long'),
  paymentTerms: z.string().trim().max(100, 'Too long'),
  currency: z.string().length(3),
  brandColor: z
    .string()
    .trim()
    .refine((v) => !v || HEX.test(v), 'Use a hex colour like #3F6650'),
  logoUrl: z.string().trim().max(500, 'Too long'),
  notes: z.string(),
});

type ClientFormValues = z.infer<typeof schema>;

const DEFAULTS: ClientFormValues = {
  name: '',
  legalName: '',
  industry: '',
  website: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  county: '',
  postcode: '',
  country: 'United Kingdom',
  billingContactName: '',
  billingEmail: '',
  billingPhone: '',
  paymentTerms: '30 days',
  currency: 'GBP',
  brandColor: '',
  logoUrl: '',
  notes: '',
};

function toFormValues(c: ClientListItem | ClientDetail): ClientFormValues {
  return {
    name: c.name,
    legalName: c.legalName ?? '',
    industry: c.industry ?? '',
    website: c.website ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    street: c.address?.street ?? '',
    city: c.address?.city ?? '',
    county: c.address?.county ?? '',
    postcode: c.address?.postcode ?? '',
    country: c.address?.country ?? '',
    billingContactName: c.billing?.contactName ?? '',
    billingEmail: c.billing?.email ?? '',
    billingPhone: c.billing?.phone ?? '',
    paymentTerms: c.billing?.paymentTerms ?? '',
    currency: c.billing?.currency ?? 'GBP',
    brandColor: c.brandColor ?? '',
    logoUrl: c.logoUrl ?? '',
    notes: c.notes ?? '',
  };
}

const orNull = (v: string) => v || null;
const orUndef = (v: string) => v || undefined;

function toRequest(v: ClientFormValues): CreateClientRequest {
  return {
    name: v.name,
    legalName: orNull(v.legalName),
    industry: orNull(v.industry),
    website: orNull(v.website),
    phone: orNull(v.phone),
    email: orNull(v.email),
    address: {
      street: orUndef(v.street),
      city: orUndef(v.city),
      county: orUndef(v.county),
      postcode: v.postcode ? v.postcode.toUpperCase() : undefined,
      country: orUndef(v.country),
    },
    billing: {
      contactName: orUndef(v.billingContactName),
      email: orUndef(v.billingEmail),
      phone: orUndef(v.billingPhone),
      paymentTerms: orUndef(v.paymentTerms),
      currency: v.currency,
    },
    brandColor: orNull(v.brandColor),
    logoUrl: orNull(v.logoUrl),
    notes: orNull(v.notes.trim()),
  };
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `space-y-1.5 ${className}` : 'space-y-1.5'}>
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

export function ClientFormDrawer({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientListItem | ClientDetail | null;
  onSaved?: (client: ClientDetail) => void;
}) {
  const isEdit = !!client;
  const createClient = useCreateClientMutation();
  const updateClient = useUpdateClientMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(client ? toFormValues(client) : DEFAULTS);
  }, [open, client, reset]);

  const brandColor = watch('brandColor');

  const submit = handleSubmit(async (values) => {
    try {
      const data = toRequest(values);
      const saved = client
        ? await updateClient.mutateAsync({ id: client.id, data })
        : await createClient.mutateAsync(data);
      toast.success(isEdit ? 'Client updated' : 'Client created', saved.name);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      toast.error(
        isEdit ? 'Could not update client' : 'Could not create client',
        errorMessage(e),
      );
    }
  });

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit client' : 'New client'}
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
            {isEdit ? 'Save changes' : 'Create client'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={submit}>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Company</h3>
          <Field label="Name" error={errors.name?.message}>
            <Input
              className="h-9"
              placeholder="Northwind Logistics"
              {...register('name')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Legal name" error={errors.legalName?.message}>
              <Input
                className="h-9"
                placeholder="Northwind Logistics Ltd"
                {...register('legalName')}
              />
            </Field>
            <Field label="Industry" error={errors.industry?.message}>
              <Input
                className="h-9"
                placeholder="Warehousing"
                {...register('industry')}
              />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <Input
                className="h-9"
                placeholder="https://northwind.co.uk"
                {...register('website')}
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input
                className="h-9"
                placeholder="0161 496 0000"
                {...register('phone')}
              />
            </Field>
            <Field
              label="Email"
              error={errors.email?.message}
              className="col-span-2"
            >
              <Input
                className="h-9"
                type="email"
                placeholder="hello@northwind.co.uk"
                {...register('email')}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Address</h3>
          <Field label="Street" error={errors.street?.message}>
            <Input
              className="h-9"
              placeholder="12 Quay Street"
              {...register('street')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" error={errors.city?.message}>
              <Input
                className="h-9"
                placeholder="Manchester"
                {...register('city')}
              />
            </Field>
            <Field label="County" error={errors.county?.message}>
              <Input
                className="h-9"
                placeholder="Greater Manchester"
                {...register('county')}
              />
            </Field>
            <Field label="Postcode" error={errors.postcode?.message}>
              <Input
                className="h-9 uppercase"
                placeholder="M3 3JE"
                {...register('postcode')}
              />
            </Field>
            <Field label="Country" error={errors.country?.message}>
              <Input className="h-9" {...register('country')} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Billing</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Contact name"
              error={errors.billingContactName?.message}
            >
              <Input
                className="h-9"
                placeholder="Accounts payable"
                {...register('billingContactName')}
              />
            </Field>
            <Field label="Email" error={errors.billingEmail?.message}>
              <Input
                className="h-9"
                type="email"
                placeholder="accounts@northwind.co.uk"
                {...register('billingEmail')}
              />
            </Field>
            <Field label="Phone" error={errors.billingPhone?.message}>
              <Input className="h-9" {...register('billingPhone')} />
            </Field>
            <Field label="Payment terms" error={errors.paymentTerms?.message}>
              <Controller
                name="paymentTerms"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        ...new Set([
                          ...PAYMENT_TERMS,
                          ...(field.value ? [field.value] : []),
                        ]),
                      ].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Currency">
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Branding and notes</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand colour" error={errors.brandColor?.message}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick brand colour"
                  value={
                    HEX.test(brandColor) && brandColor.length === 7
                      ? brandColor
                      : '#3F6650'
                  }
                  onChange={(e) =>
                    setValue('brandColor', e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                />
                <Input
                  className="h-9"
                  placeholder="#3F6650"
                  {...register('brandColor')}
                />
              </div>
            </Field>
            <Field label="Logo URL" error={errors.logoUrl?.message}>
              <Input
                className="h-9"
                placeholder="https://..."
                {...register('logoUrl')}
              />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea
              rows={4}
              placeholder="Account context, preferences, site access"
              {...register('notes')}
            />
          </Field>
        </section>
      </form>
    </DetailDrawer>
  );
}
