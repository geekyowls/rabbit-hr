import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class GetReportSummaryCommand extends OrganizationCommand {
  @IsDateString()
  @IsOptional()
  readonly from?: string;

  @IsDateString()
  @IsOptional()
  readonly to?: string;

  @IsUUID()
  @IsOptional()
  readonly jobId?: string;

  @IsUUID()
  @IsOptional()
  readonly clientId?: string;

  @IsUUID()
  @IsOptional()
  readonly recruiterId?: string;
}
