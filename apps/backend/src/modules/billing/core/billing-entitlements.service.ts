import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { In } from 'typeorm';
import {
  ACTIVE_JOB_STATUSES,
  BILLING_DODO_PRODUCT_ENV,
  BillingAccess,
  BillingInterval,
  getPlanActiveJobLimit,
  getPlanMemberLimit,
  OrgSubscriptionStatus,
  planHasFeature,
  PlanFeature,
  PlanId,
  RedisCacheService,
  resolveBillingAccess,
  resolveEffectivePlan,
} from '@boilerplate/core';
import {
  JobRepository,
  OrganizationRepository,
  UserRepository,
} from '@db/repositories';
import { JobStatus, UserStatus } from '@db/enums';
import { CACHE_KEYS, CACHE_TTL } from '@shared/cache-keys';
import {
  ActiveJobLimitReachedException,
  MemberLimitReachedException,
  PlanUpgradeRequiredException,
} from './billing.errors';

export interface OrganizationBillingState {
  organizationId: string;
  isSystemOrg: boolean;
  plan: string | null;
  billingInterval: BillingInterval | null;
  status: OrgSubscriptionStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  pastDueSince: string | null;
  cancelAtPeriodEnd: boolean;
  memberLimitOverride: number | null;
  dodoCustomerId: string | null;
  dodoSubscriptionId: string | null;
}

export interface UsageCount {
  count: number;
  limit: number | null;
}

const SEAT_STATUSES = [UserStatus.ACTIVE, UserStatus.INVITED];
const ACTIVE_JOBS = ACTIVE_JOB_STATUSES.map((status) => status as JobStatus);
const DODO_PRODUCT_ENV_KEYS = Object.keys(BILLING_DODO_PRODUCT_ENV);

@Injectable()
export class BillingEntitlementsService {
  constructor(
    private readonly config: ConfigService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    private readonly jobRepository: JobRepository,
    @Optional() private readonly cacheService?: RedisCacheService,
  ) {}

  isConfigured(): boolean {
    return (
      !!this.config.get<string>('DODO_PAYMENTS_API_KEY') &&
      !!this.config.get<string>('DODO_PAYMENTS_WEBHOOK_SECRET') &&
      DODO_PRODUCT_ENV_KEYS.some((key) => !!this.config.get<string>(key))
    );
  }

  isEnforced(): boolean {
    return (
      this.config.get<string>('BILLING_ENFORCEMENT_DISABLED') !== 'true' &&
      this.isConfigured()
    );
  }

  async getState(organizationId: string): Promise<OrganizationBillingState> {
    const key = CACHE_KEYS.billingState(organizationId);
    const cached = await this.readCache(key);
    if (cached) return cached;
    const organization = await this.organizationRepository.findOneOrFail({
      where: { id: organizationId },
      select: [
        'id',
        'isSystemOrg',
        'plan',
        'billingInterval',
        'subscriptionStatus',
        'trialEndsAt',
        'subscriptionEndsAt',
        'pastDueSince',
        'cancelAtPeriodEnd',
        'memberLimitOverride',
        'dodoCustomerId',
        'dodoSubscriptionId',
      ],
    });
    const state: OrganizationBillingState = {
      organizationId: organization.id,
      isSystemOrg: organization.isSystemOrg,
      plan: organization.plan,
      billingInterval: organization.billingInterval,
      status: organization.subscriptionStatus,
      trialEndsAt: organization.trialEndsAt?.toISOString() ?? null,
      subscriptionEndsAt:
        organization.subscriptionEndsAt?.toISOString() ?? null,
      pastDueSince: organization.pastDueSince?.toISOString() ?? null,
      cancelAtPeriodEnd: organization.cancelAtPeriodEnd,
      memberLimitOverride: organization.memberLimitOverride,
      dodoCustomerId: organization.dodoCustomerId,
      dodoSubscriptionId: organization.dodoSubscriptionId,
    };
    await this.writeCache(key, state);
    return state;
  }

  isExempt(state: OrganizationBillingState): boolean {
    return !this.isEnforced() || state.isSystemOrg;
  }

  async getAccess(organizationId: string): Promise<BillingAccess> {
    const state = await this.getState(organizationId);
    return this.accessFor(state);
  }

  accessFor(state: OrganizationBillingState): BillingAccess {
    if (this.isExempt(state)) return BillingAccess.FULL;
    return resolveBillingAccess(this.accessInput(state));
  }

  effectivePlanFor(state: OrganizationBillingState): PlanId | null {
    return resolveEffectivePlan(this.accessInput(state));
  }

  featuresFor(state: OrganizationBillingState): PlanFeature[] {
    if (this.isExempt(state)) return Object.values(PlanFeature);
    const plan = this.effectivePlanFor(state);
    return Object.values(PlanFeature).filter((feature) =>
      planHasFeature(plan, feature),
    );
  }

  memberLimitFor(state: OrganizationBillingState): number | null {
    if (this.isExempt(state)) return null;
    const plan = this.effectivePlanFor(state);
    return getPlanMemberLimit(
      plan,
      plan === state.plan ? state.memberLimitOverride : null,
    );
  }

  activeJobLimitFor(state: OrganizationBillingState): number | null {
    if (this.isExempt(state)) return null;
    return getPlanActiveJobLimit(this.effectivePlanFor(state));
  }

  async hasFeature(
    organizationId: string,
    feature: PlanFeature,
  ): Promise<boolean> {
    const state = await this.getState(organizationId);
    return this.featuresFor(state).includes(feature);
  }

  async assertFeature(
    organizationId: string,
    feature: PlanFeature,
  ): Promise<void> {
    if (!(await this.hasFeature(organizationId, feature))) {
      throw new PlanUpgradeRequiredException(feature);
    }
  }

  async getMemberUsage(organizationId: string): Promise<UsageCount> {
    const state = await this.getState(organizationId);
    const count = await this.countMembers(organizationId);
    return { count, limit: this.memberLimitFor(state) };
  }

  async getActiveJobUsage(organizationId: string): Promise<UsageCount> {
    const state = await this.getState(organizationId);
    const count = await this.countActiveJobs(organizationId);
    return { count, limit: this.activeJobLimitFor(state) };
  }

  async assertActiveJobCapacity(
    organizationId: string,
    excludeJobId?: string,
  ): Promise<void> {
    const state = await this.getState(organizationId);
    const limit = this.activeJobLimitFor(state);
    if (limit === null) return;
    const count = await this.countActiveJobs(organizationId, excludeJobId);
    if (count + 1 > limit) {
      throw new ActiveJobLimitReachedException(limit);
    }
  }

  isActiveJobStatus(status: string | null | undefined): boolean {
    return ACTIVE_JOBS.includes(status as JobStatus);
  }

  countActiveJobs(
    organizationId: string,
    excludeJobId?: string,
  ): Promise<number> {
    const query = this.jobRepository
      .createQueryBuilder('job')
      .where('job.organizationId = :organizationId', { organizationId })
      .andWhere('job.status IN (:...statuses)', { statuses: ACTIVE_JOBS });
    if (excludeJobId) {
      query.andWhere('job.id != :excludeJobId', { excludeJobId });
    }
    return query.getCount();
  }

  async assertMemberCapacity(
    organizationId: string,
    adding: number = 1,
  ): Promise<void> {
    const { count, limit } = await this.getMemberUsage(organizationId);
    if (limit !== null && count + adding > limit) {
      throw new MemberLimitReachedException(limit);
    }
  }

  countMembers(organizationId: string): Promise<number> {
    return this.userRepository.count({
      where: { organizationId, status: In(SEAT_STATUSES) },
    });
  }

  private accessInput(state: OrganizationBillingState) {
    return {
      plan: state.plan,
      status: state.status,
      trialEndsAt: state.trialEndsAt,
      subscriptionEndsAt: state.subscriptionEndsAt,
      pastDueSince: state.pastDueSince,
    };
  }

  async invalidate(organizationId: string): Promise<void> {
    if (!this.cacheService) return;
    try {
      await this.cacheService.deleteKey(
        CACHE_KEYS.billingState(organizationId),
      );
    } catch {
      return;
    }
  }

  private async readCache(
    key: string,
  ): Promise<OrganizationBillingState | null> {
    if (!this.cacheService) return null;
    try {
      const raw = await this.cacheService.getString(key);
      return raw ? (JSON.parse(raw) as OrganizationBillingState) : null;
    } catch {
      return null;
    }
  }

  private async writeCache(
    key: string,
    value: OrganizationBillingState,
  ): Promise<void> {
    if (!this.cacheService) return;
    try {
      await this.cacheService.setString(
        key,
        JSON.stringify(value),
        CACHE_TTL.BILLING_STATE,
      );
    } catch {
      return;
    }
  }
}
