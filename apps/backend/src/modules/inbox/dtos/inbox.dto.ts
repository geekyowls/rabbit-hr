import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { Trim } from '@shared/transformers/trim';
import { EmailFolder, InboxLinkedFilter, InboxSearchIn } from '@db/enums';

export const MOVABLE_FOLDERS = [
  EmailFolder.INBOX,
  EmailFolder.ARCHIVE,
  EmailFolder.TRASH,
] as const;

export const MAX_RECIPIENTS = 50;

export class ListThreadsDto extends ListPaginationDto {
  @ApiPropertyOptional({ description: 'Defaults to every accessible mailbox' })
  @IsUUID()
  @IsOptional()
  mailboxId?: string;

  @ApiPropertyOptional({
    enum: EmailFolder,
    description: 'Omit to show all mail except trash',
  })
  @IsEnum(EmailFolder)
  @IsOptional()
  folder?: EmailFolder;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(200)
  @Trim()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: InboxSearchIn, default: InboxSearchIn.ALL })
  @IsEnum(InboxSearchIn)
  @IsOptional()
  searchIn?: InboxSearchIn;

  @ApiPropertyOptional({ enum: InboxLinkedFilter })
  @IsEnum(InboxLinkedFilter)
  @IsOptional()
  linked?: InboxLinkedFilter;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  clientId?: string;
}

export class UpdateThreadDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({ enum: MOVABLE_FOLDERS })
  @IsIn(MOVABLE_FOLDERS)
  @IsOptional()
  folder?: (typeof MOVABLE_FOLDERS)[number];

  @ApiPropertyOptional({ nullable: true, description: 'null unlinks' })
  @IsUUID()
  @IsOptional()
  candidateId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'null unlinks' })
  @IsUUID()
  @IsOptional()
  clientId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'null unlinks' })
  @IsUUID()
  @IsOptional()
  applicationId?: string | null;
}

export class EmailRecipientDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(320)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string | null;
}

export class SendInboxMessageDto {
  @ApiPropertyOptional({
    description: 'Defaults to the thread mailbox or my mailbox',
  })
  @IsUUID()
  @IsOptional()
  mailboxId?: string;

  @ApiPropertyOptional({ description: 'Reply within this thread' })
  @IsUUID()
  @IsOptional()
  threadId?: string;

  @ApiPropertyOptional({
    description:
      'Message being replied to, defaults to the latest in the thread',
  })
  @IsUUID()
  @IsOptional()
  inReplyToMessageId?: string;

  @ApiPropertyOptional({
    type: [EmailRecipientDto],
    description: 'Defaults to the sender when replying',
  })
  @IsArray()
  @ArrayMaxSize(MAX_RECIPIENTS)
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  @IsOptional()
  to?: EmailRecipientDto[];

  @ApiPropertyOptional({ type: [EmailRecipientDto] })
  @IsArray()
  @ArrayMaxSize(MAX_RECIPIENTS)
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  @IsOptional()
  cc?: EmailRecipientDto[];

  @ApiPropertyOptional({ type: [EmailRecipientDto] })
  @IsArray()
  @ArrayMaxSize(MAX_RECIPIENTS)
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  @IsOptional()
  bcc?: EmailRecipientDto[];

  @ApiPropertyOptional({
    description: 'Defaults to the template subject or Re: thread subject',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: 'HTML body, merge fields allowed' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500_000)
  @IsOptional()
  html?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;
}

export class InboxStatsQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  mailboxId?: string;
}

export class InboxStatsDto {
  @ApiProperty()
  connected!: boolean;

  @ApiProperty({ description: 'Unread conversations in the inbox' })
  unread!: number;

  @ApiProperty({ description: 'Conversations in the inbox' })
  inboxCount!: number;

  @ApiProperty({ description: 'Replies sent from RabbitHR in the last 7 days' })
  repliesLast7Days!: number;

  @ApiProperty({ nullable: true, type: Number })
  medianFirstReplyHours!: number | null;

  @ApiProperty({
    description: 'Conversations used for the median, last 30 days',
  })
  firstReplySampleSize!: number;
}
