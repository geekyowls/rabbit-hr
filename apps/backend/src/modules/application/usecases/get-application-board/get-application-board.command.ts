import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class GetApplicationBoardCommand extends OrganizationCommand {
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @Min(1)
  @Max(200)
  readonly limitPerStage: number;
}
