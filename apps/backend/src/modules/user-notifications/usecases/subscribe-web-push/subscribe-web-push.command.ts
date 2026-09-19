import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class SubscribeWebPushCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly endpoint: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly p256dh: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly auth: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly userAgent?: string;
}
