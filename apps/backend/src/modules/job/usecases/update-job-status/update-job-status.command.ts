import { IsEnum, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { JobStatus } from '@db/enums';

export class UpdateJobStatusCommand extends OrganizationCommand {
  @IsUUID()
  readonly jobId: string;

  @IsEnum(JobStatus)
  readonly status: JobStatus;
}
