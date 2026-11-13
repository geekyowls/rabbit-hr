import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { PlanFeature } from '@boilerplate/core';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  PLAN_FEATURE_KEY,
  PlanFeatureGuard,
} from '../../billing/core/plan-feature.guard';

export const RequirePlanFeature = (feature: PlanFeature) =>
  applyDecorators(
    SetMetadata(PLAN_FEATURE_KEY, feature),
    UseGuards(JwtAuthGuard, PlanFeatureGuard),
  );
