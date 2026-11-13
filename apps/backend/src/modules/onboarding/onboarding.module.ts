import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingCache } from './onboarding-cache.service';
import { GetOnboardingChecklist } from './usecases/get-onboarding-checklist/get-onboarding-checklist.usecase';
import { DismissOnboarding } from './usecases/dismiss-onboarding/dismiss-onboarding.usecase';
import { AddSampleData } from './usecases/add-sample-data/add-sample-data.usecase';
import { RemoveSampleData } from './usecases/remove-sample-data/remove-sample-data.usecase';

@Module({
  controllers: [OnboardingController],
  providers: [
    OnboardingCache,
    GetOnboardingChecklist,
    DismissOnboarding,
    AddSampleData,
    RemoveSampleData,
  ],
})
export class OnboardingModule {}
