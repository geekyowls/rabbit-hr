import { Module } from '@nestjs/common';
import { WappCloudProvider } from './providers/wappcloud.provider';
import { WhatsappProviderRegistry } from './providers/whatsapp-provider.registry';
import { WhatsappConnectionService } from './services/whatsapp-connection.service';

const PROVIDERS = [
  WappCloudProvider,
  WhatsappProviderRegistry,
  WhatsappConnectionService,
];

@Module({
  providers: PROVIDERS,
  exports: PROVIDERS,
})
export class WhatsappCoreModule {}
