import { NotFoundException } from '@nestjs/common';
import { CandidateDocumentRepository } from '@db/repositories';
import { safeUserSelect } from '@shared/helpers/safe-user-select';

export function buildDocumentQuery(
  documentRepository: CandidateDocumentRepository,
  organizationId: string,
) {
  return documentRepository
    .createQueryBuilder('document')
    .leftJoin('document.verifier', 'verifier')
    .addSelect(safeUserSelect('verifier'))
    .where('document.organizationId = :organizationId', { organizationId });
}

export async function loadDocument(
  documentRepository: CandidateDocumentRepository,
  documentId: string,
  organizationId: string,
) {
  const document = await buildDocumentQuery(documentRepository, organizationId)
    .andWhere('document.id = :documentId', { documentId })
    .getOne();
  if (!document) {
    throw new NotFoundException('Document not found');
  }
  return document;
}
