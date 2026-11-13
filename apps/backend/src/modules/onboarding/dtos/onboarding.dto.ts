import { ApiProperty } from '@nestjs/swagger';
import { OnboardingStepKey } from '@boilerplate/core';

export class OnboardingStepDto {
  @ApiProperty({ enum: OnboardingStepKey })
  key: OnboardingStepKey;

  @ApiProperty()
  done: boolean;

  @ApiProperty()
  upgradeRequired: boolean;
}

export class OnboardingChecklistDto {
  @ApiProperty({ type: OnboardingStepDto, isArray: true })
  steps: OnboardingStepDto[];

  @ApiProperty()
  completed: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  dismissed: boolean;

  @ApiProperty()
  hasSampleData: boolean;
}

export class SampleDataResultDto {
  @ApiProperty()
  clients: number;

  @ApiProperty()
  jobs: number;

  @ApiProperty()
  candidates: number;
}
