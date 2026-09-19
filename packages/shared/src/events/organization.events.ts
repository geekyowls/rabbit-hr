import { BaseEvent } from './base.event';
import { EventName } from './event-names';

export interface OrganizationCreatedEvent extends BaseEvent {
  eventName: EventName.ORGANIZATION_CREATED;
  organizationId: string;
  createdBy: string;
  adminUserId?: string;
  adminPassword?: string;
  loginLink?: string;
  signupSource?: 'free_trial' | 'paid';
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

export interface OrganizationPaymentReceivedEvent extends BaseEvent {
  eventName: EventName.ORGANIZATION_PAYMENT_RECEIVED;
  organizationId: string;
  userId: string;
  planName: string;
  amount: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  paymentLinkId?: string;
}

export type OrganizationEvent =
  | OrganizationCreatedEvent
  | OrganizationPaymentReceivedEvent;
