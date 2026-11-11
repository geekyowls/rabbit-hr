import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateJobDto } from '../../dtos/update-job.dto';

export class UpdateJobCommand extends OrganizationCommand {
  @IsUUID()
  readonly jobId: string;

  @ValidateNested()
  @Type(() => UpdateJobDto)
  readonly payload: UpdateJobDto;
}
