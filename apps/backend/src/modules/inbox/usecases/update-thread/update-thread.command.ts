import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { MOVABLE_FOLDERS } from '../../dtos/inbox.dto';
import { InboxThreadCommand } from '../inbox-thread.command';

export class UpdateThreadCommand extends InboxThreadCommand {
  @IsBoolean()
  @IsOptional()
  readonly isRead?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly isArchived?: boolean;

  @IsIn(MOVABLE_FOLDERS)
  @IsOptional()
  readonly folder?: (typeof MOVABLE_FOLDERS)[number];

  @IsUUID()
  @IsOptional()
  readonly candidateId?: string | null;

  @IsUUID()
  @IsOptional()
  readonly clientId?: string | null;

  @IsUUID()
  @IsOptional()
  readonly applicationId?: string | null;
}
