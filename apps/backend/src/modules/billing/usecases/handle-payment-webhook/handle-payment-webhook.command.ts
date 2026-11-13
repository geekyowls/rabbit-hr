import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class HandlePaymentWebhookCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  readonly rawBody: string;

  @IsObject()
  readonly headers: Record<string, string | undefined>;
}
