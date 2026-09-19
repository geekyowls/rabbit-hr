import { BaseCommand } from '@boilerplate/core';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class InviteUserCommand extends BaseCommand {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsNotEmpty()
  invitedBy!: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;
}
