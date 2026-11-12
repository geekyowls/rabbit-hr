import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { TEMPLATE_NAME_PATTERN } from '../../dtos/whatsapp.dto';

export class AddWhatsappTemplateCommand extends OrganizationCommand {
  @IsString()
  @Matches(TEMPLATE_NAME_PATTERN)
  @MaxLength(255)
  readonly name: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  readonly language?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  readonly body: string;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  readonly headerText?: string;
}
