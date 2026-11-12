import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteJobCommand extends OrganizationCommand {
  @IsUUID()
  readonly jobId: string;
}
