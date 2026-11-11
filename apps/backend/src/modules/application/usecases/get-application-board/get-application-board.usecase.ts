import { Injectable } from '@nestjs/common';
import { ApplicationRepository } from '@db/repositories';
import { InterviewStatus } from '@db/enums';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { GetApplicationBoardCommand } from './get-application-board.command';

export interface BoardCardRow {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateHeadline: string | null;
  candidateLocation: string | null;
  candidateTags: string[];
  jobId: string;
  jobTitle: string;
  jobReference: string;
  clientId: string | null;
  clientName: string | null;
  stage: string;
  rating: number | null;
  shortlisted: boolean;
  source: string;
  ownerId: string | null;
  appliedAt: Date;
  stageChangedAt: Date;
  nextInterviewAt: Date | null;
  stageCount: string;
}

@Injectable()
export class GetApplicationBoard {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: GetApplicationBoardCommand) {
    const params: unknown[] = [];
    const addParam = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    let whereClause = `a."organizationId" = ${addParam(command.organizationId)}`;
    if (command.jobId) {
      whereClause += ` AND a."jobId" = ${addParam(command.jobId)}`;
    }
    if (command.clientId) {
      whereClause += ` AND j."clientId" = ${addParam(command.clientId)}`;
    }
    if (command.search) {
      const search = addParam(`%${command.search}%`);
      whereClause += ` AND (c."firstName" ILIKE ${search} OR c."lastName" ILIKE ${search} OR CONCAT(c."firstName", ' ', c."lastName") ILIKE ${search} OR c.email ILIKE ${search} OR j.title ILIKE ${search})`;
    }
    const limit = addParam(command.limitPerStage);
    const scheduled = addParam(InterviewStatus.SCHEDULED);

    const stages = await this.pipelineStageService.getStages(
      command.organizationId,
      { activeOnly: true },
    );

    const rows: BoardCardRow[] = await this.applicationRepository.query(
      `WITH ranked AS (
         SELECT
           a.id,
           a."candidateId",
           CONCAT(c."firstName", ' ', c."lastName") AS "candidateName",
           c.headline AS "candidateHeadline",
           c.location AS "candidateLocation",
           c.tags AS "candidateTags",
           a."jobId",
           j.title AS "jobTitle",
           j.reference AS "jobReference",
           j."clientId",
           cl.name AS "clientName",
           a.stage,
           a.rating,
           a.shortlisted,
           a.source,
           a."ownerId",
           a."appliedAt",
           a."stageChangedAt",
           COUNT(*) OVER (PARTITION BY a.stage) AS "stageCount",
           ROW_NUMBER() OVER (PARTITION BY a.stage ORDER BY a.shortlisted DESC, a."stageChangedAt" DESC) AS rn
         FROM applications a
         JOIN candidates c ON c.id = a."candidateId"
         JOIN jobs j ON j.id = a."jobId"
         LEFT JOIN clients cl ON cl.id = j."clientId"
         WHERE ${whereClause}
       )
       SELECT
         r.*,
         (
           SELECT MIN(i."scheduledAt")
           FROM interviews i
           WHERE i."organizationId" = $1
             AND i."applicationId" = r.id
             AND i.status = ${scheduled}
             AND i."scheduledAt" >= NOW()
         ) AS "nextInterviewAt"
       FROM ranked r
       WHERE r.rn <= ${limit}
       ORDER BY r.rn`,
      params,
    );

    const columns = new Map(
      stages.map((stage) => [
        stage.key,
        {
          stage: stage.key,
          name: stage.name,
          category: stage.category,
          color: stage.color,
          order: stage.order,
          count: 0,
          cards: [] as Omit<BoardCardRow, 'stageCount'>[],
        },
      ]),
    );

    for (const { stageCount, rn: _rn, ...card } of rows as Array<
      BoardCardRow & { rn: string }
    >) {
      const column = columns.get(card.stage);
      if (!column) continue;
      column.count = Number(stageCount);
      column.cards.push(card);
    }

    return { stages: [...columns.values()] };
  }
}
