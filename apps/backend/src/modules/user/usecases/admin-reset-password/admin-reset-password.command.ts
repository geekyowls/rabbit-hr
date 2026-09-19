import { BaseCommand } from '@boilerplate/core';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AdminResetPasswordCommand extends BaseCommand {
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsNotEmpty()
  currentUserId!: string;

  @IsBoolean()
  @IsOptional()
  notifyUser?: boolean;
}
