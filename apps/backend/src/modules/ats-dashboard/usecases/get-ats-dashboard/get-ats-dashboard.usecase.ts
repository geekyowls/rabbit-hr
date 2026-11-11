import { Injectable } from '@nestjs/common';
import {
  ActivityRepository,
  ApplicationRepository,
  CandidateRepository,
  JobRepository,
  TaskRepository,
} from '@db/repositories';
import { JobStatus, PipelineStageCategory, TaskStatus } from '@db/enums';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { buildActivityQuery } from '@modules/activity/usecases/activity-query';
import { buildTaskQuery } from '@modules/task/usecases/task-query';
import { GetAtsDashboardCommand } from './get-ats-dashboard.command';

const TOP_CLIENTS = 8;
const TREND_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 10;
const OPEN_TASK_LIMIT = 5;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class GetAtsDashboard {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly taskRepository: TaskRepository,
    private readonly pipelineStageService: PipelineStageService,
  ) {}

  async execute(command: GetAtsDashboardCommand) {
    const { organizationId, userId } = command;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (TREND_DAYS - 1),
    );

    const stages = await this.pipelineStageService.getStages(organizationId);
    const hiredKeys = stages
      .filter((s) => s.category === PipelineStageCategory.HIRED)
      .map((s) => s.key);

    const [
      openJobs,
      candidates,
      stageRows,
      placementsThisMonth,
      clientRows,
      dailyRows,
      recentActivities,
      myOpenTasks,
    ] = await Promise.all([
      this.jobRepository.count({
        where: { organizationId, status: JobStatus.PUBLISHED },
      }),
      this.candidateRepository.count({ where: { organizationId } }),
      this.applicationRepository.query<Array<{ stage: string; count: string }>>(
        `SELECT stage, COUNT(*) AS count FROM applications WHERE "organizationId" = $1 GROUP BY stage`,
        [organizationId],
      ),
      this.applicationRepository
        .createQueryBuilder('application')
        .where('application.organizationId = :organizationId', {
          organizationId,
        })
        .andWhere('application.stage = ANY(:hiredKeys)', { hiredKeys })
        .andWhere('application.stageChangedAt >= :startOfMonth', {
          startOfMonth,
        })
        .getCount(),
      this.applicationRepository.query<
        Array<{ clientId: string; clientName: string; count: string }>
      >(
        `SELECT c.id AS "clientId", c.name AS "clientName", COUNT(a.id) AS count
         FROM applications a
         JOIN jobs j ON j.id = a."jobId"
         JOIN clients c ON c.id = j."clientId"
         WHERE a."organizationId" = $1
         GROUP BY c.id, c.name
         ORDER BY count DESC, c.name ASC
         LIMIT $2`,
        [organizationId, TOP_CLIENTS],
      ),
      this.applicationRepository.query<Array<{ date: string; count: string }>>(
        `SELECT TO_CHAR("appliedAt", 'YYYY-MM-DD') AS date, COUNT(*) AS count
         FROM applications
         WHERE "organizationId" = $1 AND "appliedAt" >= $2
         GROUP BY 1`,
        [organizationId, trendStart],
      ),
      buildActivityQuery(this.activityRepository, organizationId)
        .orderBy('activity.createdAt', 'DESC')
        .take(RECENT_ACTIVITY_LIMIT)
        .getMany(),
      buildTaskQuery(this.taskRepository, organizationId)
        .andWhere('task.assigneeId = :userId', { userId })
        .andWhere('task.status = :status', { status: TaskStatus.OPEN })
        .orderBy('task.dueAt', 'ASC', 'NULLS LAST')
        .take(OPEN_TASK_LIMIT)
        .getMany(),
    ]);

    const stageCounts = new Map(
      stageRows.map((row) => [row.stage, Number(row.count)]),
    );
    const countFor = (key: string) => stageCounts.get(key) ?? 0;
    const sumWhere = (
      predicate: (category: PipelineStageCategory) => boolean,
    ) =>
      stages
        .filter((s) => predicate(s.category))
        .reduce((sum, s) => sum + countFor(s.key), 0);
    const activeApplications = sumWhere(
      (category) => !this.pipelineStageService.isClosedCategory(category),
    );
    const interviews = sumWhere(
      (category) => category === PipelineStageCategory.INTERVIEW,
    );

    const dailyCounts = new Map(
      dailyRows.map((row) => [row.date, Number(row.count)]),
    );
    const applicationsPerDay = Array.from({ length: TREND_DAYS }, (_, i) => {
      const day = new Date(trendStart);
      day.setDate(trendStart.getDate() + i);
      const date = toDateKey(day);
      return { date, count: dailyCounts.get(date) ?? 0 };
    });

    return {
      totals: {
        openJobs,
        candidates,
        activeApplications,
        placementsThisMonth,
        interviews,
      },
      funnel: stages
        .filter((s) => s.isActive)
        .map((s) => ({
          stage: s.key,
          name: s.name,
          category: s.category,
          color: s.color,
          count: countFor(s.key),
        })),
      applicationsByClient: clientRows.map((row) => ({
        clientId: row.clientId,
        clientName: row.clientName,
        count: Number(row.count),
      })),
      applicationsPerDay,
      recentActivities,
      myOpenTasks,
    };
  }
}
