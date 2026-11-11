import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { STAGE_KEY_PATTERN } from '@modules/pipeline-stage/dtos/pipeline-stage.dto';

export class UpdateApplicationStageCommand extends OrganizationCommand {
  @IsUUID()
  readonly applicationId: string;

  @IsString()
  @Matches(STAGE_KEY_PATTERN)
  readonly stage: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsOptional()
  readonly rejectionReason?: string;
}
