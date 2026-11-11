import { IsOptional, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class WhatsappMessageCommand extends OrganizationCommand {
  @IsUUID()
  readonly templateId: string;

  @IsUUID()
  readonly candidateId: string;

  @IsUUID()
  @IsOptional()
  readonly applicationId?: string;
}
