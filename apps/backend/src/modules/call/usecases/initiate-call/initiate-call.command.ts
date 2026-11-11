import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { PHONE_PATTERN } from '../../dtos/call.dto';

export class InitiateCallCommand extends OrganizationCommand {
  @IsUUID()
  readonly candidateId: string;

  @IsString()
  @Matches(PHONE_PATTERN)
  readonly staffPhone: string;

  @IsUUID()
  @IsOptional()
  readonly applicationId?: string;
}
