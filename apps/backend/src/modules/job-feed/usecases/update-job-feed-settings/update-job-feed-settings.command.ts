import { IsBoolean, IsOptional } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class UpdateJobFeedSettingsCommand extends OrganizationCommand {
  @IsBoolean()
  @IsOptional()
  readonly enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly includeClientNames?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly regenerateToken?: boolean;
}
