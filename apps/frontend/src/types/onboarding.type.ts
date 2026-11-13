import type { OnboardingStepKey } from '@boilerplate/shared';

export interface OnboardingStep {
  key: OnboardingStepKey;
  done: boolean;
  upgradeRequired: boolean;
}

export interface OnboardingChecklist {
  steps: OnboardingStep[];
  completed: number;
  total: number;
  dismissed: boolean;
  hasSampleData: boolean;
}

export interface SampleDataResult {
  clients: number;
  jobs: number;
  candidates: number;
}
