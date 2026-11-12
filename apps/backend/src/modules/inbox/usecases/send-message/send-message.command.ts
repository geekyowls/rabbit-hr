import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { EmailRecipientDto } from '../../dtos/inbox.dto';

export class SendMessageCommand extends OrganizationCommand {
  @IsUUID()
  @IsOptional()
  readonly mailboxId?: string;

  @IsUUID()
  @IsOptional()
  readonly threadId?: string;

  @IsUUID()
  @IsOptional()
  readonly inReplyToMessageId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  readonly to: EmailRecipientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  readonly cc: EmailRecipientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  readonly bcc: EmailRecipientDto[];

  @IsString()
  @IsOptional()
  readonly subject?: string;

  @IsString()
  @IsOptional()
  readonly html?: string;

  @IsUUID()
  @IsOptional()
  readonly templateId?: string;

  @IsUUID()
  @IsOptional()
  readonly candidateId?: string;

  @IsUUID()
  @IsOptional()
  readonly applicationId?: string;

  @IsUUID()
  @IsOptional()
  readonly clientId?: string;
}
