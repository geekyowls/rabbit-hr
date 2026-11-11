import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteTaskCommand extends OrganizationCommand {
  @IsUUID()
  readonly taskId: string;
}
