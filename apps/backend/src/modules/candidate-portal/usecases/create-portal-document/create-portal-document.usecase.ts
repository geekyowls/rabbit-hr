import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FILE_EXTENSION_TO_MIME_TYPE } from '@boilerplate/core';
import {
  ActivityRepository,
  ApplicationRepository,
  CandidateDocumentRepository,
} from '@db/repositories';
import { CandidateDocumentEntity, CandidateEntity } from '@db/entities';
import {
  ActivityType,
  DocumentType,
  DocumentVerificationStatus,
} from '@db/enums';
import { DOCUMENT_TYPE_LABELS } from '@modules/document/usecases/create-candidate-document/create-candidate-document.usecase';
import { buildPortalDocumentsQuery } from '../portal-query';
import { portalUploadPrefix } from '../portal-documents';
import { CreatePortalDocumentCommand } from './create-portal-document.command';

@Injectable()
export class CreatePortalDocument {
  constructor(
    private readonly dataSource: DataSource,
    private readonly documentRepository: CandidateDocumentRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(command: CreatePortalDocumentCommand) {
    const { organizationId, candidateId, payload } = command;
    if (
      !payload.fileKey.startsWith(
        portalUploadPrefix(organizationId, candidateId),
      )
    ) {
      throw new BadRequestException('Invalid upload');
    }
    let jobId: string | null = null;
    if (payload.applicationId) {
      const application = await this.applicationRepository.findOne({
        where: { id: payload.applicationId, organizationId, candidateId },
        select: ['id', 'jobId'],
      });
      if (!application) {
        throw new BadRequestException('Application not found');
      }
      jobId = application.jobId;
    }

    const extension = payload.fileKey.split('.').pop()?.toLowerCase() ?? '';
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
          mimeType: FILE_EXTENSION_TO_MIME_TYPE[extension] ?? null,
          sizeBytes: payload.sizeBytes ?? null,
          verificationStatus: DocumentVerificationStatus.PENDING,
          notes: null,
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
          jobId,
          type: ActivityType.DOCUMENT,
          title: `Candidate uploaded a document: ${name}`,
          metadata: {
            source: 'portal',
            documentId: document.id,
            documentType: payload.type,
          },
          actorId: null,
        },
        manager,
      );
      return document.id;
    });

    return buildPortalDocumentsQuery(
      this.documentRepository,
      candidateId,
      organizationId,
    )
      .andWhere('document.id = :documentId', { documentId })
      .getOneOrFail();
  }
}
