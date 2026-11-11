import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { ApplicationStage } from '@db/enums';

export class UpdateApplicationStageCommand extends OrganizationCommand {
  @IsUUID()
  readonly applicationId: string;

  @IsEnum(ApplicationStage)
  readonly stage: ApplicationStage;

  @ValidateIf(
    (o: UpdateApplicationStageCommand) => o.stage === ApplicationStage.REJECTED,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  readonly rejectionReason?: string;
}
