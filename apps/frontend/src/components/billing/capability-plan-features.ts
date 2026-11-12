import { PlanFeature } from '@boilerplate/shared';
import type { IntegrationCapabilityKey } from '@/types/integration-capabilities.type';

export const CAPABILITY_PLAN_FEATURES: Record<
  IntegrationCapabilityKey,
  PlanFeature | null
> = {
  calendar: PlanFeature.CALENDAR_SYNC,
  googleCalendar: PlanFeature.CALENDAR_SYNC,
  microsoftCalendar: PlanFeature.CALENDAR_SYNC,
  meetings: PlanFeature.CALENDAR_SYNC,
  googleMeet: PlanFeature.CALENDAR_SYNC,
  zoom: PlanFeature.CALENDAR_SYNC,
  teams: PlanFeature.CALENDAR_SYNC,
  calls: PlanFeature.CALLS,
  whatsapp: PlanFeature.WHATSAPP,
  jobFeed: PlanFeature.JOB_FEED,
  mailbox: null,
};
