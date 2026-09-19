import type { AppConfig } from './schema';

export const APP_CONFIG_VERSION = '1.6.0';

/**
 * Server-supplied defaults. The `tenant` block is set per-org by the public
 * config endpoint; the rest of the fields fall back to these values when an
 * organization has not customised them.
 *
 * The mobile app also bundles this object as a hard-fail fallback when the
 * backend is unreachable.
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  version: APP_CONFIG_VERSION,
  tenant: {
    id: '00000000-0000-0000-0000-000000000000',
    slug: 'default',
    name: 'RabbitHR',
  },
  brand: {
    displayName: 'RabbitHR',
    tagline:
      'Personalised nutrition guidance from your trusted dietitian — wherever you are.',
    theme: 'sage',
    brandColor: '',
    accentColor: '',
    logo: {
      splash: null,
      header: null,
      loginHero: null,
    },
  },
  auth: {
    email: { enabled: true, signInEnabled: true },
    phone: { enabled: false, signInEnabled: true, otpEnabled: false },
    google: { enabled: false, signInEnabled: true, signUpEnabled: false },
    apple: { enabled: false, signInEnabled: true, signUpEnabled: false },
    signup: { enabled: true, requiresApproval: false },
    forgotPassword: { enabled: true },
  },
  trackers: {
    weight: true,
    measurements: true,
    water: true,
    sleep: true,
    mood: true,
    steps: true,
    bp: true,
    glucose: true,
    photo: true,
  },
  integrations: {
    appleHealth: true,
    healthConnect: true,
  },
  links: {
    faq: 'https://rabbithr.co/help/faq',
    support: 'https://rabbithr.co/support',
    feedback: 'https://rabbithr.co/feedback',
    report: 'https://rabbithr.co/report',
    terms: 'https://rabbithr.co/terms',
    privacy: 'https://rabbithr.co/privacy',
  },
  support: {
    email: 'support@rabbithr.co',
  },
  subscription: {
    enabled: true,
    iosEnabled: false,
    androidEnabled: true,
    manageUrl: null,
  },
  iap: {
    enabled: false,
    iosEnabled: false,
    androidEnabled: false,
    showRestoreButton: true,
    showOfflineFallback: false,
  },
  banners: {
    enabled: true,
    iosEnabled: false,
    androidEnabled: true,
  },
  routineCalendar: {
    daysBefore: 5,
    daysAfter: 5,
  },
  copy: {
    common: {
      cancel: 'Cancel',
      save: 'Save',
      done: 'Done',
      skip: 'Skip',
      continue: 'Continue',
      retry: 'Retry',
      signOut: 'Sign out',
    },
    auth: {
      splash: {
        cta: 'Get started',
        terms: 'By continuing you agree to the Terms and Privacy Policy.',
      },
      login: {
        kicker: 'WELCOME BACK',
        titleTemplate: 'Sign in to {brand}',
        emailModeLabel: 'Email',
        phoneModeLabel: 'Phone',
        forgotPassword: 'Forgot password?',
        submitEmail: 'Sign in',
        submitPhone: 'Send code',
        socialDivider: 'OR CONTINUE WITH',
        socialApple: 'Apple',
        socialGoogle: 'Google',
        signupPromptTemplate: 'New to {brand}?',
        signupLink: 'Create account',
        phoneHint:
          "We'll text you a 6-digit code to sign in. Standard SMS rates may apply.",
        disabledNotice: 'Sign in is currently disabled.',
      },
      otp: {
        title: 'Enter the code',
        descriptionTemplate:
          'We sent a 6-digit code to {phone}. It expires in 5 minutes.',
        resendPrompt: "Didn't get the code?",
        resendLink: 'Resend',
        verify: 'Verify',
      },
      signup: {
        title: 'Create your account',
        subtitle: "Just the basics — we'll set up your plan in the next step.",
        terms:
          'By creating an account you agree to the Terms and Privacy Policy, and consent to your data being shared with your nutritionist.',
        submit: 'Continue',
      },
      onboarding: {
        stepLabel: 'STEP 1 OF 1',
        title: 'Tell us about you',
        submit: 'Build my plan',
      },
    },
    home: {
      morningGreeting: 'GOOD MORNING',
      sectionUpNext: 'Up next',
      sectionTrends: 'Your trends',
      sectionReadNext: 'Read next',
      seePlan: 'See plan',
      viewAll: 'View all',
      articles: 'Articles',
    },
    tabs: {
      home: 'Home',
      diet: 'Routine',
      progress: 'Progress',
      more: 'More',
    },
    settings: {
      title: 'Settings',
      sectionAccount: 'Account',
      sectionSync: 'Sync & data',
      sectionApp: 'App',
      sectionSupport: 'Support',
    },
  },
  featureFlags: {},
};
