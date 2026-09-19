import { BaseCommand } from '@boilerplate/core';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ResendInviteCommand extends BaseCommand {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsNotEmpty()
  currentUserId!: string;
}
