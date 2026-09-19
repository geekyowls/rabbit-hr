import { z } from 'zod';

type ZodDeepPartial<T extends z.ZodTypeAny> =
  T extends z.ZodObject<infer Shape>
    ? z.ZodObject<
        { [K in keyof Shape]: z.ZodOptional<ZodDeepPartial<Shape[K]>> },
        T['_def']['unknownKeys'],
        T['_def']['catchall']
      >
    : T extends z.ZodArray<infer Item>
      ? z.ZodArray<ZodDeepPartial<Item>>
      : T extends z.ZodOptional<infer Inner>
        ? z.ZodOptional<ZodDeepPartial<Inner>>
        : T extends z.ZodNullable<infer Inner>
          ? z.ZodNullable<ZodDeepPartial<Inner>>
          : T;

function deepPartialify<T extends z.ZodTypeAny>(schema: T): ZodDeepPartial<T> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const newShape: Record<string, z.ZodTypeAny> = {};
    for (const key of Object.keys(shape)) {
      newShape[key] = deepPartialify(shape[key]).optional();
    }
    return z.object(newShape) as unknown as ZodDeepPartial<T>;
  }
  if (schema instanceof z.ZodArray) {
    return z.array(
      deepPartialify(schema.element),
    ) as unknown as ZodDeepPartial<T>;
  }
  if (schema instanceof z.ZodOptional) {
    return deepPartialify(
      schema.unwrap(),
    ).optional() as unknown as ZodDeepPartial<T>;
  }
  if (schema instanceof z.ZodNullable) {
    return deepPartialify(
      schema.unwrap(),
    ).nullable() as unknown as ZodDeepPartial<T>;
  }
  if (schema instanceof z.ZodDefault) {
    return deepPartialify(
      (schema._def as { innerType: z.ZodTypeAny }).innerType,
    ) as unknown as ZodDeepPartial<T>;
  }
  if (schema instanceof z.ZodEffects) {
    return deepPartialify(
      (schema as z.ZodEffects<z.ZodTypeAny>).innerType(),
    ) as unknown as ZodDeepPartial<T>;
  }
  return schema as unknown as ZodDeepPartial<T>;
}

export const APP_CONFIG_THEMES = [
  'sage',
  'ocean',
  'bloom',
  'forest',
  'pulse',
  'slate',
  'coral',
  'midnight',
] as const;

export const APP_CONFIG_TRACKERS = [
  'weight',
  'measurements',
  'water',
  'sleep',
  'mood',
  'steps',
  'bp',
  'glucose',
  'photo',
] as const;

const ThemeKeyEnum = z.enum(APP_CONFIG_THEMES);
const TrackerKey = z.enum(APP_CONFIG_TRACKERS);

const AuthMethodSchema = z.object({
  enabled: z.boolean(),
  signInEnabled: z.boolean().optional(),
});

const PhoneAuthSchema = z.object({
  enabled: z.boolean(),
  signInEnabled: z.boolean().optional(),
  otpEnabled: z.boolean().optional().default(false),
});

const SocialAuthSchema = z.object({
  enabled: z.boolean(),
  signInEnabled: z.boolean().optional().default(true),
  signUpEnabled: z.boolean().optional().default(false),
});

const SignupSchema = z.object({
  enabled: z.boolean(),
  requiresApproval: z.boolean().default(false),
});

const ForgotPasswordSchema = z.object({
  enabled: z.boolean(),
});

const optionalUrl = () =>
  z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null));

const LogoSchema = z.object({
  splash: optionalUrl(),
  header: optionalUrl(),
  loginHero: optionalUrl(),
});

const BrandSchema = z.object({
  displayName: z.string().min(1),
  tagline: z.string().min(1),
  theme: ThemeKeyEnum,
  brandColor: z.string().default(''),
  accentColor: z.string().default(''),
  logo: LogoSchema.default({}),
});

const AuthSchema = z.object({
  email: AuthMethodSchema,
  phone: PhoneAuthSchema,
  google: SocialAuthSchema,
  apple: SocialAuthSchema,
  signup: SignupSchema,
  forgotPassword: ForgotPasswordSchema,
});

const TrackersSchema = z.record(TrackerKey, z.boolean());

const IntegrationsSchema = z.object({
  appleHealth: z.boolean(),
  healthConnect: z.boolean(),
});

const LinksSchema = z.object({
  faq: z.string().url(),
  support: z.string().url(),
  feedback: z.string().url(),
  report: z.string().url(),
  terms: z.string().url(),
  privacy: z.string().url(),
});

const SupportSchema = z.object({
  email: z.string().email(),
});

const SubscriptionSchema = z.object({
  enabled: z.boolean(),
  iosEnabled: z.boolean().optional().default(false),
  androidEnabled: z.boolean().optional().default(true),
  manageUrl: z.string().url().nullable().optional(),
});

const IapProductsSchema = z.object({
  '1m': z.string().min(1),
  '3m': z.string().min(1),
  '6m': z.string().min(1),
});

const IapSchema = z.object({
  enabled: z.boolean().default(false),
  iosEnabled: z.boolean().default(false),
  androidEnabled: z.boolean().default(false),
  productIds: IapProductsSchema.optional(),
  showRestoreButton: z.boolean().default(true),
  showOfflineFallback: z.boolean().default(false),
});

const BannersSchema = z.object({
  enabled: z.boolean().default(true),
  iosEnabled: z.boolean().default(false),
  androidEnabled: z.boolean().default(true),
});

const RoutineCalendarSchema = z.object({
  daysBefore: z.number().int().min(0).max(30).default(5),
  daysAfter: z.number().int().min(0).max(30).default(5),
});

const TenantSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
});

const CopySchema = z.object({
  common: z.object({
    cancel: z.string(),
    save: z.string(),
    done: z.string(),
    skip: z.string(),
    continue: z.string(),
    retry: z.string(),
    signOut: z.string(),
  }),
  auth: z.object({
    splash: z.object({
      cta: z.string(),
      terms: z.string(),
    }),
    login: z.object({
      kicker: z.string(),
      titleTemplate: z.string(),
      emailModeLabel: z.string(),
      phoneModeLabel: z.string(),
      forgotPassword: z.string(),
      submitEmail: z.string(),
      submitPhone: z.string(),
      socialDivider: z.string(),
      socialApple: z.string(),
      socialGoogle: z.string(),
      signupPromptTemplate: z.string(),
      signupLink: z.string(),
      phoneHint: z.string(),
      disabledNotice: z.string(),
    }),
    otp: z.object({
      title: z.string(),
      descriptionTemplate: z.string(),
      resendPrompt: z.string(),
      resendLink: z.string(),
      verify: z.string(),
    }),
    signup: z.object({
      title: z.string(),
      subtitle: z.string(),
      terms: z.string(),
      submit: z.string(),
    }),
    onboarding: z.object({
      stepLabel: z.string(),
      title: z.string(),
      submit: z.string(),
    }),
  }),
  home: z.object({
    morningGreeting: z.string(),
    sectionUpNext: z.string(),
    sectionTrends: z.string(),
    sectionReadNext: z.string(),
    seePlan: z.string(),
    viewAll: z.string(),
    articles: z.string(),
  }),
  tabs: z.object({
    home: z.string(),
    diet: z.string(),
    progress: z.string(),
    more: z.string(),
  }),
  settings: z.object({
    title: z.string(),
    sectionAccount: z.string(),
    sectionSync: z.string(),
    sectionApp: z.string(),
    sectionSupport: z.string(),
  }),
});

export type AppCopy = z.infer<typeof CopySchema>;

export const AppConfigSchema = z.object({
  version: z.string().min(1),
  tenant: TenantSchema,
  brand: BrandSchema,
  auth: AuthSchema,
  trackers: TrackersSchema,
  integrations: IntegrationsSchema,
  links: LinksSchema,
  support: SupportSchema,
  subscription: SubscriptionSchema,
  iap: IapSchema.default({
    enabled: false,
    iosEnabled: false,
    androidEnabled: false,
    showRestoreButton: true,
    showOfflineFallback: false,
  }),
  banners: BannersSchema.default({
    enabled: true,
    iosEnabled: false,
    androidEnabled: true,
  }),
  routineCalendar: RoutineCalendarSchema.default({
    daysBefore: 5,
    daysAfter: 5,
  }),
  copy: CopySchema,
  featureFlags: z.record(z.string(), z.boolean()).default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type ThemeKey = z.infer<typeof ThemeKeyEnum>;
export type TrackerId = z.infer<typeof TrackerKey>;

export const TRACKER_IDS: TrackerId[] = [...APP_CONFIG_TRACKERS];

export interface AppVersionContext {
  appVersion?: string;
  appBuild?: string;
  platform?: 'ios' | 'android';
}

export const VersionOverrideMatchSchema = z.object({
  appVersion: z.string().min(1),
  appBuilds: z.array(z.string().min(1)).optional(),
  platform: z.enum(['ios', 'android']).optional(),
});

export const VersionOverrideSchema = z.object({
  id: z.string().min(1),
  description: z.string().default(''),
  enabled: z.boolean().default(true),
  match: VersionOverrideMatchSchema,
  config: deepPartialify(AppConfigSchema),
});

export type VersionOverrideMatch = z.infer<typeof VersionOverrideMatchSchema>;
export type VersionOverride = z.infer<typeof VersionOverrideSchema>;

/**
 * Partial schema used for system-admin updates. Allows any subset of the full
 * AppConfig to be sent in a PUT and deep-merged on the server.
 *
 * Also accepts `_versionOverrides` — a server-internal array of per-app-version
 * overrides that the public config endpoint matches against and merges before
 * serving. Treated as REPLACE (not deep-merge) on save so admins can reorder /
 * remove entries cleanly.
 */
export const AppConfigUpdateSchema = deepPartialify(AppConfigSchema).extend({
  _versionOverrides: z.array(VersionOverrideSchema).optional(),
});
export type AppConfigUpdate = z.infer<typeof AppConfigUpdateSchema>;
