import { z } from 'zod/v4';
import { OrgSubscriptionStatus, PlanId } from '@boilerplate/shared';

export const organizationBillingSchema = z.object({
  plan: z.enum(PlanId),
  status: z.enum(OrgSubscriptionStatus),
  memberLimit: z
    .string()
    .trim()
    .regex(/^\d*$/, 'Enter a whole number')
    .refine(
      (value) => value === '' || Number(value) >= 1,
      'Must be at least 1',
    ),
  trialEndsAt: z.string(),
  subscriptionEndsAt: z.string(),
});

export type OrganizationBillingFormData = z.infer<
  typeof organizationBillingSchema
>;
