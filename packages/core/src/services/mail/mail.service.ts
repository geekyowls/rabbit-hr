import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface SendEmailResponse {
  messageId: string;
  success: boolean;
}

export abstract class MailService {
  abstract sendEmail(options: SendEmailOptions): Promise<SendEmailResponse>;
}

export class SESMailService implements MailService {
  private ses: SESClient;
  private defaultFrom: string;

  constructor() {
    this.ses = new SESClient({
      region: process.env.SES_REGION as string,
      credentials: {
        accessKeyId: process.env.SES_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY as string,
      },
    });
    const fromName = process.env.MAIL_FROM_NAME || 'Boilerplate';
    const fromEmail = process.env.MAIL_FROM_EMAIL as string;
    this.defaultFrom = `"${fromName}" <${fromEmail}>`;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResponse> {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

    const command = new SendEmailCommand({
      Source: options.from || this.defaultFrom,
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: options.text,
            Charset: 'UTF-8',
          },
          ...(options.html && {
            Html: {
              Data: options.html,
              Charset: 'UTF-8',
            },
          }),
        },
      },
      ...(options.replyTo && {
        ReplyToAddresses: [options.replyTo],
      }),
    });

    try {
      const result = await this.ses.send(command);
      return {
        messageId: result.MessageId || 'unknown',
        success: true,
      };
    } catch (error: any) {
      throw new Error(`Failed to send email via SES: ${error.message}`);
    }
  }
}

export class ResendMailService implements MailService {
  private resend: Resend;
  private defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }
    this.resend = new Resend(apiKey);
    const fromName = process.env.MAIL_FROM_NAME || 'Boilerplate';
    const fromEmail = process.env.MAIL_FROM_EMAIL as string;
    this.defaultFrom = `${fromName} <${fromEmail}>`;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResponse> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        ...(options.html && { html: options.html }),
        ...(options.replyTo && { reply_to: options.replyTo }),
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      return {
        messageId: data?.id || 'unknown',
        success: true,
      };
    } catch (error: any) {
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
  }
}
