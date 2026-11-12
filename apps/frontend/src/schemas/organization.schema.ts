import { z } from 'zod/v4';

const optionalTrimmedString = (schema: z.ZodTypeAny) =>
  z
    .preprocess(
      (value) => (typeof value === 'string' ? value.trim() : value),
      z.union([schema, z.literal('')]),
    )
    .nullable()
    .optional();

export const addressSchema = z.object({
  street: optionalTrimmedString(z.string().max(500)),
  city: optionalTrimmedString(z.string().max(100)),
  state: optionalTrimmedString(z.string().max(100)),
  zipCode: optionalTrimmedString(z.string().max(20)),
  country: optionalTrimmedString(z.string().max(100)),
});

export const pdfTemplateSchema = z.enum([
  'default',
  'variation-2',
  'variation-3',
  'variation-4',
  'weekly-grid',
  'two-column',
  'plain-grid',
  'clinic-table',
  'mono-minimal',
  'compact-list',
]);

export const invoiceSettingsSchema = z.object({
  prefix: z.string().max(20).optional(),
  defaultNotes: z.string().max(2000).optional(),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(200),
  logo: z.string().max(500).nullable().optional(),
  phone: optionalTrimmedString(z.string().max(20)),
  email: optionalTrimmedString(z.email('Invalid email address').max(200)),
  website: optionalTrimmedString(z.url('Invalid website URL').max(200)),
  address: addressSchema.nullable().optional(),
  privacyPolicyUrl: optionalTrimmedString(z.url('Invalid URL').max(500)),
  termsAndConditionsUrl: optionalTrimmedString(z.url('Invalid URL').max(500)),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;
