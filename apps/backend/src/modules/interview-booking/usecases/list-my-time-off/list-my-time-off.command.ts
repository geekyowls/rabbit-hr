import { IsDateString, IsOptional } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class ListMyTimeOffCommand extends OrganizationCommand {
  @IsDateString()
  @IsOptional()
  readonly from?: string;

  @IsDateString()
  @IsOptional()
  readonly to?: string;
}
