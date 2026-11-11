import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ActivityRepository,
  ApplicationRepository,
  CandidateDocumentRepository,
  CandidateRepository,
} from '@db/repositories';
import { CandidateDocumentEntity, CandidateEntity } from '@db/entities';
import { ActivityType, DocumentType } from '@db/enums';
import { loadDocument } from '../document-query';
import { CreateCandidateDocumentCommand } from './create-candidate-document.command';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.CV]: 'CV',
  [DocumentType.ID]: 'ID document',
  [DocumentType.RIGHT_TO_WORK]: 'Work eligibility',
  [DocumentType.REFERENCE]: 'Reference',
  [DocumentType.CERTIFICATE]: 'Certificate',
  [DocumentType.DBS]: 'Background check',
  [DocumentType.OTHER]: 'Document',
};

@Injectable()
export class CreateCandidateDocument {
  constructor(
    private readonly dataSource: DataSource,
    private readonly documentRepository: CandidateDocumentRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(command: CreateCandidateDocumentCommand) {
    const { organizationId, candidateId, payload } = command;

    const exists = await this.candidateRepository.exists({
      where: { id: candidateId, organizationId },
    });
    if (!exists) {
      throw new NotFoundException('Candidate not found');
    }
    if (!payload.fileKey.startsWith(`organizations/${organizationId}/`)) {
      throw new BadRequestException('Invalid file key');
    }
    if (payload.applicationId) {
      const applicationExists = await this.applicationRepository.exists({
        where: { id: payload.applicationId, organizationId, candidateId },
      });
      if (!applicationExists) {
        throw new BadRequestException('Application not found');
      }
    }

    const name = payload.name || DOCUMENT_TYPE_LABELS[payload.type];

    const documentId = await this.dataSource.transaction(async (manager) => {
      const document = await manager.save(
        manager.create(CandidateDocumentEntity, {
          organizationId,
          candidateId,
          applicationId: payload.applicationId ?? null,
          type: payload.type,
          name,
          fileKey: payload.fileKey,
          fileName: payload.fileName,
          mimeType: payload.mimeType ?? null,
          sizeBytes: payload.sizeBytes ?? null,
          expiresAt: payload.expiresAt ?? null,
          notes: payload.notes ?? null,
        }),
      );

      if (payload.type === DocumentType.CV) {
        await manager.update(
          CandidateEntity,
          { id: candidateId, organizationId },
          { cvFileKey: payload.fileKey, cvFileName: payload.fileName },
        );
      }

      await this.activityRepository.record(
        {
          organizationId,
          candidateId,
          applicationId: payload.applicationId ?? null,
          type: ActivityType.DOCUMENT,
          title: `${name} uploaded`,
          metadata: { documentId: document.id, documentType: payload.type },
          actorId: command.userId,
        },
        manager,
      );

      return document.id;
    });

    return loadDocument(this.documentRepository, documentId, organizationId);
  }
}
