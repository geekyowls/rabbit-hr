import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { OrganizationIntegrationEntity } from '@db/entities';
import { IntegrationCapabilitiesService } from './integration-capabilities.service';

@Injectable()
export class OrganizationIntegrationSubscriber implements EntitySubscriberInterface<OrganizationIntegrationEntity> {
  constructor(
    dataSource: DataSource,
    private readonly capabilities: IntegrationCapabilitiesService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return OrganizationIntegrationEntity;
  }

  afterInsert(event: InsertEvent<OrganizationIntegrationEntity>): void {
    this.invalidate(event.entity?.organizationId);
  }

  afterUpdate(event: UpdateEvent<OrganizationIntegrationEntity>): void {
    this.invalidate(
      (event.entity as Partial<OrganizationIntegrationEntity> | undefined)
        ?.organizationId ?? event.databaseEntity?.organizationId,
    );
  }

  afterRemove(event: RemoveEvent<OrganizationIntegrationEntity>): void {
    this.invalidate(
      event.entity?.organizationId ?? event.databaseEntity?.organizationId,
    );
  }

  private invalidate(organizationId: string | undefined): void {
    if (organizationId) {
      void this.capabilities.invalidate(organizationId);
    }
  }
}
