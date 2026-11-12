import { IsArray, IsString } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class ListMailboxesCommand extends OrganizationCommand {
  @IsArray()
  @IsString({ each: true })
  readonly permissions: string[];
}
