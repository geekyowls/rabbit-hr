import { ConfigService } from '@nestjs/config';
import { MailService, ResendMailService, SESMailService } from './mail.service';

function getMailServiceClass(provider: string | undefined) {
  const normalizedProvider = provider?.toUpperCase();
  switch (normalizedProvider) {
    case 'SES':
      return SESMailService;
    case 'RESEND':
      return ResendMailService;
    default:
      return ResendMailService; // Default to Resend
  }
}

export const mailService = {
  provide: MailService,
  useFactory: (configService: ConfigService) => {
    const mailProvider = configService.get<string>('MAIL_PROVIDER');
    const MailClass = getMailServiceClass(mailProvider);
    return new MailClass();
  },
  inject: [ConfigService],
};

export { MailService };
export * from './templates';
