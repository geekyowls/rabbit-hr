import { Injectable } from '@nestjs/common';
import { ApplicationRepository } from '@db/repositories';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import {
  listPortalApplicationRows,
  stageCategories,
  toPortalApplication,
} from '../portal-query';
import { PortalCandidateCommand } from '../portal-candidate.command';

@Injectable()
export class ListPortalApplications {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: PortalCandidateCommand) {
    const [categories, rows] = await Promise.all([
      stageCategories(this.pipelineStageService, command.organizationId),
      listPortalApplicationRows(
        this.applicationRepository,
        command.candidateId,
        command.organizationId,
      ),
    ]);
    return rows.map((row) => toPortalApplication(row, categories));
  }
}
