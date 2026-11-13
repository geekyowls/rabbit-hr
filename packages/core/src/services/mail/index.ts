import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DisabledMailService,
  MailService,
  ResendMailService,
  SESMailService,
} from './mail.service';

function getMailServiceClass(configService: ConfigService) {
  const provider = configService.get<string>('MAIL_PROVIDER')?.toUpperCase();
  if (provider === 'SES') return SESMailService;
  if (configService.get<string>('RESEND_API_KEY')) return ResendMailService;
  new Logger('MailService').warn(
    'RESEND_API_KEY is not set, outgoing email is disabled',
  );
  return DisabledMailService;
}

export const mailService = {
  provide: MailService,
  useFactory: (configService: ConfigService) => {
    const MailClass = getMailServiceClass(configService);
    return new MailClass();
  },
  inject: [ConfigService],
};

export { MailService };
export * from './templates';
