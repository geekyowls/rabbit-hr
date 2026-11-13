import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  BILLING_ERROR_CODES,
  BillingAccess,
  getLowestPlanWithFeature,
  PLAN_FEATURE_LABELS,
  PlanFeature,
} from '@boilerplate/core';

export class PlanUpgradeRequiredException extends ForbiddenException {
  constructor(feature: PlanFeature) {
    const plan = getLowestPlanWithFeature(feature);
    super({
      message: `Upgrade to ${plan.name} to use ${PLAN_FEATURE_LABELS[feature].toLowerCase()}`,
      errors: {
        code: BILLING_ERROR_CODES.PLAN_UPGRADE_REQUIRED,
        feature,
        plan: plan.id,
      },
    });
  }
}

export class MemberLimitReachedException extends ConflictException {
  constructor(limit: number) {
    super({
      message: `Your plan includes up to ${limit} team ${limit === 1 ? 'member' : 'members'}. Upgrade to add more`,
      errors: { code: BILLING_ERROR_CODES.MEMBER_LIMIT_REACHED, limit },
    });
  }
}

export class ActiveJobLimitReachedException extends ConflictException {
  constructor(limit: number) {
    super({
      message: `Your plan includes up to ${limit} active ${limit === 1 ? 'job' : 'jobs'}. Upgrade to add more`,
      errors: { code: BILLING_ERROR_CODES.ACTIVE_JOB_LIMIT_REACHED, limit },
    });
  }
}

export class BillingInactiveException extends HttpException {
  constructor(access: BillingAccess) {
    const needsPlan = access === BillingAccess.NEEDS_PLAN;
    super(
      {
        message: needsPlan
          ? 'Choose a plan to start using RabbitHR'
          : 'Your subscription is inactive. Renew it in Billing to make changes',
        errors: {
          code: needsPlan
            ? BILLING_ERROR_CODES.BILLING_NEEDS_PLAN
            : BILLING_ERROR_CODES.BILLING_READ_ONLY,
        },
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
