import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateTaskDto } from '../../dtos/task.dto';

export class CreateTaskCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateTaskDto)
  readonly payload: CreateTaskDto;
}
