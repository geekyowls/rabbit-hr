import { Module } from '@nestjs/common';
import { WhatsappCoreModule } from './whatsapp-core.module';
import { WhatsappSendProcessor } from './processors/whatsapp-send.processor';

@Module({
  imports: [WhatsappCoreModule],
  providers: [WhatsappSendProcessor],
})
export class WhatsappWorkerModule {}
