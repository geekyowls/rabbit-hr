import { IsUUID } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';

export class DeleteDocumentCommand extends OrganizationCommand {
  @IsUUID()
  readonly documentId: string;
}
