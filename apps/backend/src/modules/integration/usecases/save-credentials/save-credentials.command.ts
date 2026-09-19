import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class SaveCredentialsCommand extends OrganizationCommand {
  @IsString()
  @IsNotEmpty()
  readonly provider!: string;

  @IsString()
  @IsOptional()
  readonly apiKey?: string;

  @IsString()
  @IsOptional()
  readonly authId?: string;

  @IsString()
  @IsOptional()
  readonly authToken?: string;

  @IsString()
  @IsOptional()
  readonly phoneNumber?: string;

  @IsString()
  @IsOptional()
  readonly webhookSecret?: string;
}
