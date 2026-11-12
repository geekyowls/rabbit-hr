import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CallDisposition } from '@db/enums';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class UpdateCallCommand extends OrganizationCommand {
  @IsUUID()
  readonly callId: string;

  @IsEnum(CallDisposition)
  @IsOptional()
  readonly disposition?: CallDisposition | null;

  @IsString()
  @MaxLength(5000)
  @IsOptional()
  readonly note?: string | null;
}
