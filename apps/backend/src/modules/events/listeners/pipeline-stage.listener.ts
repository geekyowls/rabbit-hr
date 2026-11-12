import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import type { OrganizationCreatedEvent } from '@boilerplate/core';
import { EventName } from '@boilerplate/core';
import { createDefaultPipelineStages } from '@shared/services/pipeline-stage.service';

@Injectable()
export class PipelineStageListener {
  private readonly logger = new Logger(PipelineStageListener.name);

  constructor(private readonly dataSource: DataSource) {}

  @OnEvent(EventName.ORGANIZATION_CREATED, { async: true })
  async handleOrganizationCreated(
    event: OrganizationCreatedEvent,
  ): Promise<void> {
    try {
      await createDefaultPipelineStages(
        this.dataSource.manager,
        event.organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create default pipeline stages for org ${event.organizationId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
