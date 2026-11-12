import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class CompleteTaskCommand extends OrganizationCommand {
  @IsUUID()
  readonly taskId: string;
}
