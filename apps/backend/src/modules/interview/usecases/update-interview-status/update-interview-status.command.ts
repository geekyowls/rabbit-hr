import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { InterviewStatus } from '@db/enums';

export class UpdateInterviewStatusCommand extends OrganizationCommand {
  @IsUUID()
  readonly interviewId: string;

  @IsEnum(InterviewStatus)
  readonly status: InterviewStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsOptional()
  readonly reason?: string;
}
