import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { EmailFolder, InboxLinkedFilter, InboxSearchIn } from '@db/enums';

export class ListThreadsCommand extends BasePaginatedCommand {
  @IsUUID()
  @IsOptional()
  mailboxId?: string;

  @IsEnum(EmailFolder)
  @IsOptional()
  folder?: EmailFolder;

  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  search?: string;

  @IsEnum(InboxSearchIn)
  @IsOptional()
  searchIn?: InboxSearchIn;

  @IsEnum(InboxLinkedFilter)
  @IsOptional()
  linked?: InboxLinkedFilter;

  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;
}
