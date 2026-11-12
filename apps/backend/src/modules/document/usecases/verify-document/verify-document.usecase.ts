import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ActivityRepository,
  CandidateDocumentRepository,
} from '@db/repositories';
import { ActivityType } from '@db/enums';
import { loadDocument } from '../document-query';
import { VerifyDocumentCommand } from './verify-document.command';

@Injectable()
export class VerifyDocument {
  constructor(
    private readonly documentRepository: CandidateDocumentRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(command: VerifyDocumentCommand) {
    const document = await this.documentRepository.findOne({
      where: { id: command.documentId, organizationId: command.organizationId },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.verificationStatus = command.status;
    document.verifiedBy = command.userId;
    document.verifiedAt = new Date();
    if (command.notes !== undefined) {
      document.notes = command.notes;
    }
    await this.documentRepository.save(document);

    await this.activityRepository.record({
      organizationId: command.organizationId,
      candidateId: document.candidateId,
      applicationId: document.applicationId,
      type: ActivityType.DOCUMENT,
      title: `${document.name} ${command.status}`,
      body: command.notes ?? null,
      metadata: { documentId: document.id, status: command.status },
      actorId: command.userId,
    });

    return loadDocument(
      this.documentRepository,
      document.id,
      command.organizationId,
    );
  }
}
