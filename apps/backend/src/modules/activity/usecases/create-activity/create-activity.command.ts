import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import {
  MANUAL_ACTIVITY_TYPES,
  type ManualActivityType,
} from '../../dtos/activity.dto';

export class CreateActivityCommand extends OrganizationCommand {
  @IsIn(MANUAL_ACTIVITY_TYPES)
  readonly type: ManualActivityType;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  readonly title?: string;

  @IsString()
  @IsNotEmpty()
  readonly body: string;

  @IsUUID()
  @IsOptional()
  readonly candidateId?: string;

  @IsUUID()
  @IsOptional()
  readonly applicationId?: string;

  @IsUUID()
  @IsOptional()
  readonly jobId?: string;

  @IsUUID()
  @IsOptional()
  readonly clientId?: string;
}
