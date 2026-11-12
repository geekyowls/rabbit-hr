import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateTaskDto } from '../../dtos/task.dto';

export class UpdateTaskCommand extends OrganizationCommand {
  @IsUUID()
  readonly taskId: string;

  @ValidateNested()
  @Type(() => UpdateTaskDto)
  readonly payload: UpdateTaskDto;
}
