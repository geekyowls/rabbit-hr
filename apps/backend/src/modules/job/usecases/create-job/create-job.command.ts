import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { CreateJobDto } from '../../dtos/create-job.dto';

export class CreateJobCommand extends OrganizationCommand {
  @ValidateNested()
  @Type(() => CreateJobDto)
  readonly payload: CreateJobDto;
}
