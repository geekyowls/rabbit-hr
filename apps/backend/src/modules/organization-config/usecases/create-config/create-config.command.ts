import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { OrganizationConfigType } from '@db/enums';

export class CreateConfigCommand extends OrganizationCommand {
  @IsEnum(OrganizationConfigType)
  @IsNotEmpty()
  readonly type: OrganizationConfigType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @IsObject()
  @IsOptional()
  readonly value?: Record<string, unknown>;
}
