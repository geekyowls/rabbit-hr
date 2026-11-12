import { Injectable, Optional } from '@nestjs/common';
import { PlanFeature, RedisCacheService } from '@boilerplate/core';
import {
  JobFeedRepository,
  MailboxConnectionRepository,
  OrganizationIntegrationRepository,
} from '@db/repositories';
import {
  IntegrationCategory,
  MailboxConnectionStatus,
  OrganizationIntegrationStatus,
} from '@db/enums';
import { CACHE_KEYS, CACHE_TTL } from '@shared/cache-keys';
import { ContextLogger } from '@shared/framework/context-logger';
import { BillingEntitlementsService } from '@modules/billing/core/billing-entitlements.service';
import {
  CAPABILITY_LABELS,
  CAPABILITY_PLAN_FEATURES,
  CapabilityKey,
  INTEGRATION_PROVIDERS,
  IntegrationCapabilities,
  IntegrationNotConnectedException,
  OrganizationCapabilities,
  WHATSAPP_PROVIDERS,
} from './integration-capabilities.types';

interface ConnectedProvider {
  provider: string;
  category: IntegrationCategory;
}

@Injectable()
export class IntegrationCapabilitiesService {
  private readonly logger = new ContextLogger(
    IntegrationCapabilitiesService.name,
  );

  constructor(
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
    private readonly jobFeedRepository: JobFeedRepository,
    private readonly mailboxConnectionRepository: MailboxConnectionRepository,
    @Optional() private readonly cacheService?: RedisCacheService,
    @Optional() private readonly entitlements?: BillingEntitlementsService,
  ) {}

  async getCapabilities(
    organizationId: string,
    userId: string,
  ): Promise<IntegrationCapabilities> {
    const [organization, jobFeed, mailbox] = await Promise.all([
      this.getOrganizationCapabilities(organizationId),
      this.isJobFeedEnabled(organizationId),
      this.getMailbox(organizationId, userId),
    ]);
    return { ...organization, jobFeed, mailbox };
  }

  async getOrganizationCapabilities(
    organizationId: string,
  ): Promise<OrganizationCapabilities> {
    const [connected, features] = await Promise.all([
      this.getConnectedCapabilities(organizationId),
      this.getPlanFeatures(organizationId),
    ]);
    const calendarSync = features.includes(PlanFeature.CALENDAR_SYNC);
    return {
      calendar: {
        google: connected.calendar.google && calendarSync,
        microsoft: connected.calendar.microsoft && calendarSync,
      },
      meetings: {
        googleMeet: connected.meetings.googleMeet && calendarSync,
        zoom: connected.meetings.zoom && calendarSync,
        teams: connected.meetings.teams && calendarSync,
      },
      calls: connected.calls && features.includes(PlanFeature.CALLS),
      whatsapp: connected.whatsapp && features.includes(PlanFeature.WHATSAPP),
    };
  }

  private async getConnectedCapabilities(
    organizationId: string,
  ): Promise<OrganizationCapabilities> {
    const key = CACHE_KEYS.integrationCapabilities(organizationId);
    const cached = await this.readCache(key);
    if (cached) return cached;
    const capabilities = this.fromProviders(
      await this.loadConnectedProviders(organizationId),
    );
    await this.writeCache(key, capabilities);
    return capabilities;
  }

  private async getPlanFeatures(
    organizationId: string,
  ): Promise<PlanFeature[]> {
    if (!this.entitlements) return Object.values(PlanFeature);
    const state = await this.entitlements.getState(organizationId);
    return this.entitlements.featuresFor(state);
  }

  async has(organizationId: string, key: CapabilityKey): Promise<boolean> {
    if (key === 'jobFeed') return this.isJobFeedEnabled(organizationId);
    if (key === 'mailbox') return false;
    const caps = await this.getOrganizationCapabilities(organizationId);
    switch (key) {
      case 'calendar':
        return caps.calendar.google || caps.calendar.microsoft;
      case 'googleCalendar':
        return caps.calendar.google;
      case 'microsoftCalendar':
        return caps.calendar.microsoft;
      case 'googleMeet':
        return caps.meetings.googleMeet;
      case 'zoom':
        return caps.meetings.zoom;
      case 'teams':
        return caps.meetings.teams;
      case 'calls':
        return caps.calls;
      case 'whatsapp':
        return caps.whatsapp;
    }
  }

  async require(organizationId: string, key: CapabilityKey): Promise<void> {
    const feature = CAPABILITY_PLAN_FEATURES[key];
    if (feature && this.entitlements) {
      await this.entitlements.assertFeature(organizationId, feature);
    }
    if (!(await this.has(organizationId, key))) {
      throw new IntegrationNotConnectedException(CAPABILITY_LABELS[key]);
    }
  }

  async invalidate(organizationId: string): Promise<void> {
    if (!this.cacheService) return;
    try {
      await this.cacheService.deleteKey(
        CACHE_KEYS.integrationCapabilities(organizationId),
      );
    } catch (error) {
      this.logger.warn(
        `Capabilities cache not cleared: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private fromProviders(
    connected: ConnectedProvider[],
  ): OrganizationCapabilities {
    const providers = new Set(connected.map((c) => c.provider));
    const google = providers.has(INTEGRATION_PROVIDERS.GOOGLE_CALENDAR);
    const microsoft = providers.has(INTEGRATION_PROVIDERS.MICROSOFT);
    return {
      calendar: { google, microsoft },
      meetings: {
        googleMeet: google,
        zoom: providers.has(INTEGRATION_PROVIDERS.ZOOM),
        teams: microsoft,
      },
      calls: connected.some(
        (c) => c.category === IntegrationCategory.TELEPHONY,
      ),
      whatsapp: WHATSAPP_PROVIDERS.some((p) => providers.has(p)),
    };
  }

  private async loadConnectedProviders(
    organizationId: string,
  ): Promise<ConnectedProvider[]> {
    const rows = await this.organizationIntegrationRepository
      .createQueryBuilder('oi')
      .innerJoin('oi.supportedIntegration', 'si')
      .select(['si.provider AS provider', 'si.category AS category'])
      .where('oi.organizationId = :organizationId', { organizationId })
      .andWhere('oi.status = :status', {
        status: OrganizationIntegrationStatus.CONNECTED,
      })
      .andWhere('si.isActive = true')
      .getRawMany<ConnectedProvider>();
    return rows;
  }

  private async isJobFeedEnabled(organizationId: string): Promise<boolean> {
    const features = await this.getPlanFeatures(organizationId);
    if (!features.includes(PlanFeature.JOB_FEED)) return false;
    const count = await this.jobFeedRepository.count({
      where: { organizationId, enabled: true },
    });
    return count > 0;
  }

  private async getMailbox(
    organizationId: string,
    userId: string,
  ): Promise<IntegrationCapabilities['mailbox']> {
    const mailbox = await this.mailboxConnectionRepository
      .createQueryBuilder('mailbox')
      .select(['mailbox.id', 'mailbox.provider', 'mailbox.userId'])
      .where('mailbox.organizationId = :organizationId', { organizationId })
      .andWhere('mailbox.status = :status', {
        status: MailboxConnectionStatus.CONNECTED,
      })
      .andWhere('(mailbox.userId = :userId OR mailbox.isShared = true)', {
        userId,
      })
      .orderBy('CASE WHEN mailbox.userId = :userId THEN 0 ELSE 1 END', 'ASC')
      .getOne();
    return { connected: !!mailbox, provider: mailbox?.provider ?? null };
  }

  private async readCache(
    key: string,
  ): Promise<OrganizationCapabilities | null> {
    if (!this.cacheService) return null;
    try {
      const raw = await this.cacheService.getString(key);
      return raw ? (JSON.parse(raw) as OrganizationCapabilities) : null;
    } catch {
      return null;
    }
  }

  private async writeCache(
    key: string,
    value: OrganizationCapabilities,
  ): Promise<void> {
    if (!this.cacheService) return;
    try {
      await this.cacheService.setString(
        key,
        JSON.stringify(value),
        CACHE_TTL.INTEGRATION_CAPABILITIES,
      );
    } catch {
      return;
    }
  }
}
