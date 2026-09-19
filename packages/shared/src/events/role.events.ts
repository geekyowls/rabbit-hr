import { BaseEvent } from './base.event';
import { EventName } from './event-names';

export interface RoleCreatedEvent extends BaseEvent {
  eventName: EventName.ROLE_CREATED;
  roleId: string;
  organizationId: string;
  createdBy: string;
}

export interface RoleUpdatedEvent extends BaseEvent {
  eventName: EventName.ROLE_UPDATED;
  roleId: string;
  organizationId: string;
  updatedBy: string;
  permissionsChanged: boolean;
}

export interface RoleDeletedEvent extends BaseEvent {
  eventName: EventName.ROLE_DELETED;
  roleId: string;
  organizationId: string;
  deletedBy: string;
}

export type RoleEvent = RoleCreatedEvent | RoleUpdatedEvent | RoleDeletedEvent;
