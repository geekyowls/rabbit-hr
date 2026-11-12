import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { WhatsappTemplateCommand } from '../template.command';

export class UpdateWhatsappTemplateMappingCommand extends WhatsappTemplateCommand {
  @IsObject()
  readonly mapping: Record<string, unknown>;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  readonly label?: string;
}
