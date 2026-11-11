import { Module } from '@nestjs/common';
import { WhatsappCoreModule } from './whatsapp-core.module';
import { WhatsappController } from './whatsapp.controller';
import { PlaceholderService } from './services/placeholder.service';
import { WhatsappService } from './services/whatsapp.service';
import { ListWhatsappTemplates } from './usecases/list-templates/list-templates.usecase';
import { SyncWhatsappTemplates } from './usecases/sync-templates/sync-templates.usecase';
import { AddWhatsappTemplate } from './usecases/add-template/add-template.usecase';
import { DeleteWhatsappTemplate } from './usecases/delete-template/delete-template.usecase';
import { UpdateWhatsappTemplateMapping } from './usecases/update-template-mapping/update-template-mapping.usecase';
import { PreviewWhatsappMessage } from './usecases/preview-message/preview-message.usecase';
import { SendWhatsappMessage } from './usecases/send-message/send-message.usecase';
import { ListCandidateWhatsappMessages } from './usecases/list-candidate-messages/list-candidate-messages.usecase';

@Module({
  imports: [WhatsappCoreModule],
  controllers: [WhatsappController],
  providers: [
    PlaceholderService,
    WhatsappService,
    ListWhatsappTemplates,
    SyncWhatsappTemplates,
    AddWhatsappTemplate,
    DeleteWhatsappTemplate,
    UpdateWhatsappTemplateMapping,
    PreviewWhatsappMessage,
    SendWhatsappMessage,
    ListCandidateWhatsappMessages,
  ],
  exports: [WhatsappCoreModule, WhatsappService],
})
export class WhatsappModule {}
