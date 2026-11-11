import { IsArray, IsString, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class MailboxCommand extends OrganizationCommand {
  @IsUUID()
  readonly mailboxId: string;

  @IsArray()
  @IsString({ each: true })
  readonly permissions: string[];
}
