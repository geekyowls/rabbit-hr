import { Injectable } from '@nestjs/common';
import { IntegrationCapabilitiesService } from '../../core/integration-capabilities.service';
import { IntegrationCapabilities } from '../../core/integration-capabilities.types';
import { GetIntegrationCapabilitiesCommand } from './get-integration-capabilities.command';

@Injectable()
export class GetIntegrationCapabilities {
  constructor(private readonly capabilities: IntegrationCapabilitiesService) {}

  async execute(
    command: GetIntegrationCapabilitiesCommand,
  ): Promise<IntegrationCapabilities> {
    return this.capabilities.getCapabilities(
      command.organizationId,
      command.userId,
    );
  }
}
