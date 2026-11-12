import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidateDocumentRepository } from '@db/repositories';
import { DeleteDocumentCommand } from './delete-document.command';

@Injectable()
export class DeleteDocument {
  constructor(
    private readonly documentRepository: CandidateDocumentRepository,
  ) {}

  async execute(command: DeleteDocumentCommand): Promise<{ success: boolean }> {
    const result = await this.documentRepository.delete({
      id: command.documentId,
      organizationId: command.organizationId,
    });
    if (!result.affected) {
      throw new NotFoundException('Document not found');
    }
    return { success: true };
  }
}
