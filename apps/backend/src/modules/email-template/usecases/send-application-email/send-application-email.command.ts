import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class SendApplicationEmailCommand extends OrganizationCommand {
  @IsUUID()
  readonly applicationId: string;

  @IsUUID()
  @IsOptional()
  readonly templateId?: string;

  @ValidateIf((o: SendApplicationEmailCommand) => !o.templateId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  readonly subject?: string;

  @ValidateIf((o: SendApplicationEmailCommand) => !o.templateId)
  @IsString()
  @IsNotEmpty()
  readonly body?: string;
}
