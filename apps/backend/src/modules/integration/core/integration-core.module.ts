import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  cacheManagerProvider,
  GoogleCalendarService,
  MicrosoftGraphService,
  redisCacheService,
  ZoomService,
} from '@boilerplate/core';
import { IntegrationCapabilitiesService } from './integration-capabilities.service';
import { IntegrationTokenService } from './integration-token.service';
import { OrganizationIntegrationSubscriber } from './organization-integration.subscriber';

const PROVIDERS = [
  GoogleCalendarService,
  ZoomService,
  MicrosoftGraphService,
  IntegrationCapabilitiesService,
  IntegrationTokenService,
];

@Global()
@Module({
  providers: [...PROVIDERS, OrganizationIntegrationSubscriber],
  exports: PROVIDERS,
})
export class IntegrationCoreModule {
  static forWorker(): DynamicModule {
    return {
      module: IntegrationCoreModule,
      providers: [cacheManagerProvider, redisCacheService],
    };
  }
}
