import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CandidateDocumentRepository,
  CandidateRepository,
} from '@db/repositories';
import { buildDocumentQuery } from '../document-query';
import { ListCandidateDocumentsCommand } from './list-candidate-documents.command';

@Injectable()
export class ListCandidateDocuments {
  constructor(
    private readonly documentRepository: CandidateDocumentRepository,
    private readonly candidateRepository: CandidateRepository,
  ) {}

  async execute(command: ListCandidateDocumentsCommand) {
    const exists = await this.candidateRepository.exists({
      where: {
        id: command.candidateId,
        organizationId: command.organizationId,
      },
    });
    if (!exists) {
      throw new NotFoundException('Candidate not found');
    }

    return buildDocumentQuery(this.documentRepository, command.organizationId)
      .andWhere('document.candidateId = :candidateId', {
        candidateId: command.candidateId,
      })
      .orderBy('document.createdAt', 'DESC')
      .getMany();
  }
}
