export interface BaseEvent {
  eventName: string;
  timestamp: Date;
  organizationId?: string;
  triggeredBy?: string;
}
