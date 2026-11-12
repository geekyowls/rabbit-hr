import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { MailboxConnectionEntity } from '@db/entities';
import { MailboxConnectionStatus, MailboxProvider } from '@db/enums';

export class ConnectMailboxDto {
  @ApiPropertyOptional({
    description:
      'Connect as a shared team mailbox (needs mailbox:shared:manage)',
  })
  @IsBoolean()
  @IsOptional()
  shared?: boolean;
}

export class MailboxAuthUrlDto {
  @ApiProperty()
  authUrl!: string;
}

export class MailboxResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: MailboxProvider })
  provider!: MailboxProvider;

  @ApiProperty()
  emailAddress!: string;

  @ApiProperty({ nullable: true, type: String })
  displayName!: string | null;

  @ApiProperty()
  isShared!: boolean;

  @ApiProperty()
  isOwner!: boolean;

  @ApiProperty()
  canManage!: boolean;

  @ApiProperty({ enum: MailboxConnectionStatus })
  status!: MailboxConnectionStatus;

  @ApiProperty({ nullable: true, type: String })
  errorMessage!: string | null;

  @ApiProperty({ nullable: true, type: String })
  lastSyncedAt!: Date | null;

  @ApiProperty()
  syncEnabled!: boolean;

  @ApiProperty({ description: 'Seeded demo mailbox, never synced or sent' })
  isDemo!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class MailboxSyncResponseDto {
  @ApiProperty()
  queued!: boolean;

  @ApiProperty({ nullable: true, type: String })
  reason!: string | null;
}

export function toMailboxResponse(
  mailbox: MailboxConnectionEntity,
  userId: string,
  canManage: boolean,
): MailboxResponseDto {
  return {
    id: mailbox.id,
    provider: mailbox.provider,
    emailAddress: mailbox.emailAddress,
    displayName: mailbox.displayName,
    isShared: mailbox.isShared,
    isOwner: mailbox.userId === userId,
    canManage,
    status: mailbox.status,
    errorMessage: mailbox.errorMessage,
    lastSyncedAt: mailbox.lastSyncedAt,
    syncEnabled: mailbox.syncEnabled,
    isDemo: mailbox.isDemo,
    createdAt: mailbox.createdAt,
  };
}
