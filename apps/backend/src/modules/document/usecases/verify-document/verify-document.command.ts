import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import {
  DOCUMENT_REVIEW_STATUSES,
  type DocumentReviewStatus,
} from '../../dtos/document.dto';

export class VerifyDocumentCommand extends OrganizationCommand {
  @IsUUID()
  readonly documentId: string;

  @IsIn(DOCUMENT_REVIEW_STATUSES)
  readonly status: DocumentReviewStatus;

  @IsString()
  @IsOptional()
  readonly notes?: string;
}
