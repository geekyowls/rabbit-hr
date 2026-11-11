import { Module } from '@nestjs/common';
import { EmailTemplateController } from './email-template.controller';
import { ListEmailTemplates } from './usecases/list-email-templates/list-email-templates.usecase';
import { CreateEmailTemplate } from './usecases/create-email-template/create-email-template.usecase';
import { UpdateEmailTemplate } from './usecases/update-email-template/update-email-template.usecase';
import { DeleteEmailTemplate } from './usecases/delete-email-template/delete-email-template.usecase';
import { CandidateEmailService } from './services/candidate-email.service';
import { SendApplicationEmail } from './usecases/send-application-email/send-application-email.usecase';

const USE_CASES = [
  ListEmailTemplates,
  CreateEmailTemplate,
  UpdateEmailTemplate,
  DeleteEmailTemplate,
  SendApplicationEmail,
];

@Module({
  controllers: [EmailTemplateController],
  providers: [...USE_CASES, CandidateEmailService],
  exports: [CandidateEmailService],
})
export class EmailTemplateModule {}
