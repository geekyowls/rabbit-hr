import { Injectable } from '@nestjs/common';
import {
  ApplicationRepository,
  CandidateDocumentRepository,
} from '@db/repositories';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import {
  buildPortalDocumentsQuery,
  listDocumentRequests,
  listPortalApplicationRows,
  stageCategories,
} from '../portal-query';
import { PortalCandidateCommand } from '../portal-candidate.command';

@Injectable()
export class ListPortalDocuments {
  constructor(
    private readonly documentRepository: CandidateDocumentRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: PortalCandidateCommand) {
    const { candidateId, organizationId } = command;
    const [documents, rows, categories] = await Promise.all([
      buildPortalDocumentsQuery(
        this.documentRepository,
        candidateId,
        organizationId,
      )
        .orderBy('document.createdAt', 'DESC')
        .getMany(),
      listPortalApplicationRows(
        this.applicationRepository,
        candidateId,
        organizationId,
      ),
      stageCategories(this.pipelineStageService, organizationId),
    ]);
    const requests = await listDocumentRequests(
      this.documentRepository,
      rows,
      categories,
      candidateId,
      organizationId,
    );
    return { documents, requests };
  }
}
