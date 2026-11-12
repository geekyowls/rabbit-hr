import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '@boilerplate/core';
import { CandidateDocumentRepository } from '@db/repositories';
import { GetPortalDocumentDownloadUrlCommand } from './get-portal-document-download-url.command';

@Injectable()
export class GetPortalDocumentDownloadUrl {
  constructor(
    private readonly documentRepository: CandidateDocumentRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: GetPortalDocumentDownloadUrlCommand) {
    const document = await this.documentRepository.findOne({
      where: {
        id: command.documentId,
        candidateId: command.candidateId,
        organizationId: command.organizationId,
      },
      select: ['id', 'fileKey'],
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    const { signedUrl } = await this.storageService.getReadSignedUrl(
      document.fileKey,
    );
    return { url: signedUrl };
  }
}
