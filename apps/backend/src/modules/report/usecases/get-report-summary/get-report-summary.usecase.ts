import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { ClientRepository, UserRepository } from '@db/repositories';
import {
  ActivityType,
  CandidateSource,
  InterviewStatus,
  OfferStatus,
  PipelineStageCategory,
} from '@db/enums';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';
import { TIME_TO_HIRE_METHOD } from '../../dtos/report.dto';
import {
  average,
  countBy,
  DAY_MS,
  median,
  percent,
  startOfWeek,
  toDateKey,
} from '../report-math';
import { GetReportSummaryCommand } from './get-report-summary.command';

const DEFAULT_RANGE_DAYS = 90;
const NO_REASON = 'No reason given';
const NO_CLIENT = 'Direct';
const FUNNEL_EXCLUDED = [
  PipelineStageCategory.REJECTED,
  PipelineStageCategory.WITHDRAWN,
];

interface ApplicationRow {
  id: string;
  stage: string;
  source: CandidateSource;
  appliedAt: Date;
  stageChangedAt: Date;
  rejectionReason: string | null;
  clientId: string | null;
  recruiterId: string | null;
}

interface StageChangeRow {
  applicationId: string;
  from: string | null;
  to: string | null;
  createdAt: Date;
}

interface InterviewRow {
  status: InterviewStatus;
  recruiterId: string | null;
  scorecards: string;
  ratingSum: string | null;
}

interface OfferRow {
  status: OfferStatus;
  createdAt: Date;
  sentAt: Date | null;
  respondedAt: Date | null;
  recruiterId: string | null;
}

interface JobCountRow {
  recruiterId: string | null;
  count: string;
}

interface ScopedQuery {
  params: unknown[];
  add: (value: unknown) => string;
  jobClause: string;
}

@Injectable()
export class GetReportSummary {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly clientRepository: ClientRepository,
    private readonly pipelineStageService: PipelineStageService,
    private readonly atsSettingsService: AtsSettingsService,
  ) {}

  private scope(command: GetReportSummaryCommand): ScopedQuery {
    const params: unknown[] = [command.organizationId];
    const add = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };
    const clauses: string[] = [];
    if (command.jobId) clauses.push(`j.id = ${add(command.jobId)}`);
    if (command.clientId) {
      clauses.push(`j."clientId" = ${add(command.clientId)}`);
    }
    if (command.recruiterId) {
      clauses.push(
        `COALESCE(j."recruiterId", j."ownerId") = ${add(command.recruiterId)}`,
      );
    }
    return {
      params,
      add,
      jobClause: clauses.map((c) => ` AND ${c}`).join(''),
    };
  }

  async execute(command: GetReportSummaryCommand) {
    const { organizationId } = command;
    const to = command.to ? new Date(command.to) : new Date();
    const from = command.from
      ? new Date(command.from)
      : new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);
    if (from > to) {
      throw new BadRequestException('`from` must be before `to`');
    }
    const inRange = (date: Date | null) => !!date && date >= from && date <= to;

    const [stages, settings] = await Promise.all([
      this.pipelineStageService.getStages(organizationId),
      this.atsSettingsService.get(organizationId),
    ]);
    const categoryByKey = new Map(stages.map((s) => [s.key, s.category]));
    const isHired = (key: string | null) =>
      !!key && categoryByKey.get(key) === PipelineStageCategory.HIRED;

    const appScope = this.scope(command);
    const appWindow = `a."appliedAt" <= ${appScope.add(to)} AND (a."appliedAt" >= ${appScope.add(from)} OR a."stageChangedAt" >= $${appScope.params.length})`;
    const appFrom = `FROM applications a JOIN jobs j ON j.id = a."jobId" WHERE a."organizationId" = $1${appScope.jobClause} AND ${appWindow}`;

    const interviewScope = this.scope(command);
    const offerScope = this.scope(command);
    const jobScope = this.scope(command);
    const offerFrom = offerScope.add(from);
    const offerTo = offerScope.add(to);

    const [applications, stageChanges, interviews, offers, jobCounts] =
      await Promise.all([
        this.dataSource.query<ApplicationRow[]>(
          `SELECT a.id, a.stage, a.source, a."appliedAt", a."stageChangedAt", a."rejectionReason", j."clientId", COALESCE(j."recruiterId", j."ownerId") AS "recruiterId" ${appFrom}`,
          appScope.params,
        ),
        this.dataSource.query<StageChangeRow[]>(
          `SELECT act."applicationId", act.metadata->>'from' AS "from", act.metadata->>'to' AS "to", act."createdAt"
           FROM activities act
           JOIN applications a ON a.id = act."applicationId"
           JOIN jobs j ON j.id = a."jobId"
           WHERE act."organizationId" = $1 AND act.type = '${ActivityType.STAGE_CHANGE}'${appScope.jobClause} AND ${appWindow}
           ORDER BY act."createdAt" ASC`,
          appScope.params,
        ),
        this.dataSource.query<InterviewRow[]>(
          `SELECT i.status, COALESCE(j."recruiterId", j."ownerId") AS "recruiterId",
             (SELECT COUNT(*) FROM interview_scorecards s WHERE s."interviewId" = i.id) AS scorecards,
             (SELECT SUM(s."overallRating") FROM interview_scorecards s WHERE s."interviewId" = i.id) AS "ratingSum"
           FROM interviews i JOIN jobs j ON j.id = i."jobId"
           WHERE i."organizationId" = $1${interviewScope.jobClause}
             AND i."scheduledAt" >= ${interviewScope.add(from)} AND i."scheduledAt" <= ${interviewScope.add(to)}`,
          interviewScope.params,
        ),
        this.dataSource.query<OfferRow[]>(
          `SELECT o.status, o."createdAt", o."sentAt", o."respondedAt", COALESCE(j."recruiterId", j."ownerId") AS "recruiterId"
           FROM offers o JOIN jobs j ON j.id = o."jobId"
           WHERE o."organizationId" = $1${offerScope.jobClause}
             AND ((o."createdAt" BETWEEN ${offerFrom} AND ${offerTo})
               OR (o."sentAt" BETWEEN ${offerFrom} AND ${offerTo})
               OR (o."respondedAt" BETWEEN ${offerFrom} AND ${offerTo}))`,
          offerScope.params,
        ),
        this.dataSource.query<JobCountRow[]>(
          `SELECT COALESCE(j."recruiterId", j."ownerId") AS "recruiterId", COUNT(*) AS count
           FROM jobs j WHERE j."organizationId" = $1${jobScope.jobClause}
           GROUP BY 1`,
          jobScope.params,
        ),
      ]);

    const historyByApp = new Map<string, StageChangeRow[]>();
    for (const change of stageChanges) {
      const list = historyByApp.get(change.applicationId) ?? [];
      list.push(change);
      historyByApp.set(change.applicationId, list);
    }

    const hiredAtOf = (app: ApplicationRow): Date | null => {
      const entry = historyByApp.get(app.id)?.find((c) => isHired(c.to));
      if (entry) return new Date(entry.createdAt);
      return isHired(app.stage) ? new Date(app.stageChangedAt) : null;
    };

    const cohort = applications.filter((a) => inRange(new Date(a.appliedAt)));
    const hires = applications
      .map((app) => ({ app, hiredAt: hiredAtOf(app) }))
      .filter((h) => inRange(h.hiredAt)) as Array<{
      app: ApplicationRow;
      hiredAt: Date;
    }>;

    const hireDays = hires.map(
      (h) =>
        (h.hiredAt.getTime() - new Date(h.app.appliedAt).getTime()) / DAY_MS,
    );

    const durations = new Map<string, number[]>();
    for (const app of applications) {
      const history = historyByApp.get(app.id) ?? [];
      const visits = [
        {
          stage: history[0]?.from ?? app.stage,
          at: new Date(app.appliedAt).getTime(),
        },
        ...history
          .filter((c) => c.to)
          .map((c) => ({ stage: c.to!, at: new Date(c.createdAt).getTime() })),
      ];
      for (let i = 0; i < visits.length - 1; i++) {
        const list = durations.get(visits[i].stage) ?? [];
        list.push(Math.max(0, visits[i + 1].at - visits[i].at) / DAY_MS);
        durations.set(visits[i].stage, list);
      }
    }

    const funnelStages = stages.filter(
      (s) => s.isActive && !FUNNEL_EXCLUDED.includes(s.category),
    );
    const funnelIndex = new Map(funnelStages.map((s, i) => [s.key, i]));
    const furthestStage = (app: ApplicationRow) =>
      Math.max(
        0,
        funnelIndex.get(app.stage) ?? 0,
        ...(historyByApp.get(app.id) ?? []).map(
          (c) => (c.to ? funnelIndex.get(c.to) : undefined) ?? 0,
        ),
      );
    const furthest = cohort.map(furthestStage);
    const reachedCounts = funnelStages.map(
      (_stage, index) => furthest.filter((f) => f >= index).length,
    );

    const sourceApplications = countBy(cohort, (a) => a.source);
    const sourceHires = countBy(hires, (h) => h.app.source);
    const sources = [
      ...new Set([...sourceApplications.keys(), ...sourceHires.keys()]),
    ]
      .map((source) => {
        const apps = sourceApplications.get(source) ?? 0;
        const hired = sourceHires.get(source) ?? 0;
        return {
          source: source as CandidateSource,
          applications: apps,
          hires: hired,
          hireRate: percent(hired, apps),
        };
      })
      .sort((a, b) => b.applications - a.applications);

    const weeks = new Map<string, { applications: number; hires: number }>();
    for (
      let cursor = startOfWeek(from, settings.weekStartsOn);
      cursor <= to;
      cursor = new Date(cursor.getTime() + 7 * DAY_MS)
    ) {
      weeks.set(toDateKey(cursor), { applications: 0, hires: 0 });
    }
    const weekKey = (date: Date) =>
      toDateKey(startOfWeek(date, settings.weekStartsOn));
    for (const app of cohort) {
      const bucket = weeks.get(weekKey(new Date(app.appliedAt)));
      if (bucket) bucket.applications++;
    }
    for (const hire of hires) {
      const bucket = weeks.get(weekKey(hire.hiredAt));
      if (bucket) bucket.hires++;
    }

    const offerCreated = offers.filter((o) => inRange(new Date(o.createdAt)));
    const offerSent = offers.filter((o) =>
      inRange(o.sentAt && new Date(o.sentAt)),
    );
    const responded = (status: OfferStatus) =>
      offers.filter(
        (o) =>
          o.status === status &&
          inRange(o.respondedAt && new Date(o.respondedAt)),
      ).length;
    const accepted = responded(OfferStatus.ACCEPTED);
    const declined = responded(OfferStatus.DECLINED);

    const interviewCount = (status: InterviewStatus) =>
      interviews.filter((i) => i.status === status).length;
    const completed = interviewCount(InterviewStatus.COMPLETED);
    const noShow = interviewCount(InterviewStatus.NO_SHOW);
    const scorecards = interviews.reduce(
      (sum, i) => sum + Number(i.scorecards),
      0,
    );
    const ratingSum = interviews.reduce(
      (sum, i) => sum + Number(i.ratingSum ?? 0),
      0,
    );

    const rejectedReasons = countBy(
      cohort.filter(
        (a) => categoryByKey.get(a.stage) === PipelineStageCategory.REJECTED,
      ),
      (a) => a.rejectionReason?.trim() || NO_REASON,
    );

    const clientApplications = countBy(cohort, (a) => a.clientId);
    const clientHires = countBy(hires, (h) => h.app.clientId);
    const clientIds = [
      ...new Set([...clientApplications.keys(), ...clientHires.keys()]),
    ];

    const recruiterIds = [
      ...new Set(
        [
          ...jobCounts.map((j) => j.recruiterId),
          ...cohort.map((a) => a.recruiterId),
          ...interviews.map((i) => i.recruiterId),
          ...offerCreated.map((o) => o.recruiterId),
          ...hires.map((h) => h.app.recruiterId),
        ].filter((id): id is string => !!id),
      ),
    ];
    const concreteClientIds = clientIds.filter((id): id is string => !!id);
    const [recruiters, clients] = await Promise.all([
      recruiterIds.length > 0
        ? this.userRepository.find({
            where: { id: In(recruiterIds), organizationId },
            select: ['id', 'firstName', 'lastName', 'email'],
          })
        : Promise.resolve([]),
      concreteClientIds.length > 0
        ? this.clientRepository.find({
            where: { id: In(concreteClientIds), organizationId },
            select: ['id', 'name'],
          })
        : Promise.resolve([]),
    ]);
    const clientName = new Map(clients.map((c) => [c.id, c.name]));
    const recruiterCount = <T>(
      items: T[],
      key: (item: T) => string | null,
      id: string,
    ) => items.filter((item) => key(item) === id).length;

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      totals: {
        applications: cohort.length,
        hires: hires.length,
        interviews: interviews.length,
        offersSent: offerSent.length,
      },
      timeToHire: {
        method: TIME_TO_HIRE_METHOD,
        hires: hires.length,
        medianDays: median(hireDays),
        averageDays: average(hireDays),
      },
      timeInStage: stages
        .filter((s) => durations.has(s.key))
        .map((s) => {
          const values = durations.get(s.key)!;
          return {
            stage: s.key,
            name: s.name,
            category: s.category,
            samples: values.length,
            medianDays: median(values),
            averageDays: average(values),
          };
        }),
      funnel: funnelStages.map((s, index) => ({
        stage: s.key,
        name: s.name,
        category: s.category,
        reached: reachedCounts[index],
        conversionToNext:
          index < funnelStages.length - 1
            ? percent(reachedCounts[index + 1], reachedCounts[index])
            : null,
      })),
      sources,
      applicationsOverTime: [...weeks.entries()].map(([weekStart, v]) => ({
        weekStart,
        ...v,
      })),
      offers: {
        created: offerCreated.length,
        sent: offerSent.length,
        accepted,
        declined,
        pendingApproval: offerCreated.filter(
          (o) => o.status === OfferStatus.PENDING_APPROVAL,
        ).length,
        acceptanceRate: percent(accepted, accepted + declined),
      },
      interviews: {
        scheduled: interviews.length,
        completed,
        cancelled: interviewCount(InterviewStatus.CANCELLED),
        noShow,
        noShowRate: percent(noShow, completed + noShow),
        scorecards,
        averageRating:
          scorecards > 0
            ? Math.round((ratingSum / scorecards) * 10) / 10
            : null,
      },
      recruiters: recruiters
        .map((recruiter) => ({
          recruiter,
          jobs: Number(
            jobCounts.find((j) => j.recruiterId === recruiter.id)?.count ?? 0,
          ),
          applications: recruiterCount(
            cohort,
            (a) => a.recruiterId,
            recruiter.id,
          ),
          interviews: recruiterCount(
            interviews,
            (i) => i.recruiterId,
            recruiter.id,
          ),
          offers: recruiterCount(
            offerCreated,
            (o) => o.recruiterId,
            recruiter.id,
          ),
          hires: recruiterCount(hires, (h) => h.app.recruiterId, recruiter.id),
        }))
        .sort((a, b) => b.hires - a.hires || b.applications - a.applications),
      rejectionReasons: [...rejectedReasons.entries()]
        .map(([reason, count]) => ({ reason: reason ?? NO_REASON, count }))
        .sort((a, b) => b.count - a.count),
      clients: clientIds
        .map((clientId) => ({
          clientId,
          name: (clientId && clientName.get(clientId)) || NO_CLIENT,
          applications: clientApplications.get(clientId) ?? 0,
          hires: clientHires.get(clientId) ?? 0,
        }))
        .sort((a, b) => b.applications - a.applications),
    };
  }
}
