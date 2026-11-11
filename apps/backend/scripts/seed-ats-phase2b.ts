import { DataSource, DeepPartial } from 'typeorm';
import {
  ActivityEntity,
  InterviewEntity,
  OfferApproval,
  OfferEntity,
  OrganizationEntity,
  PipelineStageEntity,
  ScorecardCriterion,
  ScorecardEntity,
  resolveAtsSettings,
} from '../src/database/entities';
import {
  ActivityType,
  EmploymentType,
  InterviewStatus,
  InterviewType,
  OfferDecision,
  OfferStatus,
  PipelineStageCategory,
  SalaryPeriod,
  ScorecardRecommendation,
  UserStatus,
} from '../src/database/enums';
import { mulberry32, SeedAtsContext } from './seed-ats';

const rand = mulberry32(20261112);
const int = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)];
const chance = (p: number) => rand() < p;
const pickMany = <T>(items: readonly T[], count: number): T[] => {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
};

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const INTERVIEW_TARGET = 60;
const INTERVIEW_SKIP_THRESHOLD = 40;
const OFFER_SKIP_THRESHOLD = 15;

const INTERVIEW_FORMATS: Array<{ type: InterviewType; title: string }> = [
  { type: InterviewType.PHONE, title: 'Phone screen' },
  { type: InterviewType.VIDEO, title: 'Video interview' },
  { type: InterviewType.ONSITE, title: 'Client site interview' },
  { type: InterviewType.TECHNICAL, title: 'Technical interview' },
  { type: InterviewType.PANEL, title: 'Panel interview' },
  { type: InterviewType.ASSESSMENT, title: 'Skills assessment' },
];

const CRITERIA = [
  'Relevant experience',
  'Communication',
  'Reliability',
  'Problem solving',
  'Team fit',
  'Technical skills',
  'Customer focus',
];

const SCORECARD_SUMMARIES: Record<ScorecardRecommendation, string[]> = {
  [ScorecardRecommendation.STRONG_YES]: [
    'Outstanding candidate, clear examples and very well prepared.',
    'Exactly what the client is after, would move quickly.',
  ],
  [ScorecardRecommendation.YES]: [
    'Solid interview, a few gaps but nothing that worries me.',
    'Good experience and a positive attitude, happy to progress.',
  ],
  [ScorecardRecommendation.NO]: [
    'Experience is lighter than the role needs right now.',
    'Struggled with the scenario questions.',
  ],
  [ScorecardRecommendation.STRONG_NO]: [
    'Not a fit for this client, answers lacked substance.',
  ],
};

const CANCEL_REASONS = [
  'Client rescheduled due to a site visit',
  'Candidate unwell, will rebook next week',
  'Hiring manager unavailable',
];

const DECLINE_REASONS = [
  'Accepted a counter offer from current employer',
  'Commute too long for the salary offered',
];

interface SeedApplication {
  id: string;
  candidateId: string;
  jobId: string;
  stage: string;
  appliedAt: Date;
  stageChangedAt: Date;
  clientId: string | null;
  jobTitle: string;
  location: string | null;
  employmentType: EmploymentType;
  salaryMax: number | null;
  payRate: number | null;
  rateUnit: string | null;
  hiringManagerId: string | null;
  recruiterId: string | null;
  firstName: string;
  lastName: string;
}

const meetingCode = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const part = (n: number) =>
    Array.from({ length: n }, () => pick(letters.split(''))).join('');
  return `${part(3)}-${part(4)}-${part(3)}`;
};

const at = (time: number) => {
  const date = new Date(time);
  date.setUTCMinutes(pick([0, 30]), 0, 0);
  date.setUTCHours(int(8, 16));
  return date;
};

function recommendationFor(rating: number): ScorecardRecommendation {
  if (rating >= 5) return ScorecardRecommendation.STRONG_YES;
  if (rating >= 4) return ScorecardRecommendation.YES;
  if (rating >= 2) return ScorecardRecommendation.NO;
  return ScorecardRecommendation.STRONG_NO;
}

async function loadApplications(
  dataSource: DataSource,
  organizationId: string,
): Promise<SeedApplication[]> {
  return dataSource.query(
    `SELECT a.id, a."candidateId", a."jobId", a.stage, a."appliedAt", a."stageChangedAt",
            j."clientId", j.title AS "jobTitle", j.location, j."employmentType",
            j."salaryMax"::float AS "salaryMax", j."payRate"::float AS "payRate", j."rateUnit",
            j."hiringManagerId", COALESCE(j."recruiterId", j."ownerId") AS "recruiterId",
            c."firstName", c."lastName"
     FROM applications a
     JOIN jobs j ON j.id = a."jobId"
     JOIN candidates c ON c.id = a."candidateId"
     WHERE a."organizationId" = $1
     ORDER BY a."appliedAt", a.id`,
    [organizationId],
  );
}

async function seedStageHistory(
  dataSource: DataSource,
  organizationId: string,
  stages: PipelineStageEntity[],
): Promise<void> {
  const missing: Array<{
    id: string;
    candidateId: string;
    jobId: string;
    clientId: string | null;
    stage: string;
    stageChangedAt: Date;
    appliedAt: Date;
    lastTo: string | null;
    lastAt: Date | null;
    ownerId: string | null;
  }> = await dataSource.query(
    `SELECT a.id, a."candidateId", a."jobId", j."clientId", a.stage, a."stageChangedAt", a."appliedAt", a."ownerId",
            last."to" AS "lastTo", last."createdAt" AS "lastAt"
     FROM applications a
     JOIN jobs j ON j.id = a."jobId"
     LEFT JOIN LATERAL (
       SELECT act.metadata->>'to' AS "to", act."createdAt" FROM activities act
       WHERE act."applicationId" = a.id AND act.type = 'stage_change'
       ORDER BY act."createdAt" DESC LIMIT 1
     ) last ON TRUE
     WHERE a."organizationId" = $1
       AND a.stage <> (SELECT key FROM pipeline_stages ps WHERE ps."organizationId" = a."organizationId" ORDER BY ps."order" LIMIT 1)
       AND (last."to" IS NULL OR last."to" <> a.stage)`,
    [organizationId],
  );
  if (missing.length === 0) return;
  const nameByKey = new Map(stages.map((s) => [s.key, s.name]));
  const categoryByKey = new Map(stages.map((s) => [s.key, s.category]));
  const repo = dataSource.getRepository(ActivityEntity);
  const rows: Array<DeepPartial<ActivityEntity>> = missing.map((app) => {
    const from = app.lastTo ?? 'applied';
    const floor = new Date(app.lastAt ?? app.appliedAt).getTime();
    const createdAt = new Date(
      Math.max(floor + DAY, new Date(app.stageChangedAt).getTime()),
    );
    return {
      organizationId,
      candidateId: app.candidateId,
      applicationId: app.id,
      jobId: app.jobId,
      clientId: app.clientId,
      type: ActivityType.STAGE_CHANGE,
      title: `Moved from ${nameByKey.get(from) ?? from} to ${nameByKey.get(app.stage) ?? app.stage}`,
      metadata: {
        from,
        to: app.stage,
        toCategory: categoryByKey.get(app.stage),
      },
      actorId: app.ownerId,
      createdAt: new Date(Math.min(createdAt.getTime(), NOW)),
    };
  });
  await repo.save(
    rows.map((r) => repo.create(r)),
    { chunk: 50 },
  );
  console.log(`Backfilled ${rows.length} stage change activities`);
}

async function seedInterviews(
  dataSource: DataSource,
  context: SeedAtsContext,
  applications: SeedApplication[],
  categoryByKey: Map<string, PipelineStageCategory>,
  userIds: string[],
  timezone: string,
): Promise<void> {
  const { organizationId } = context;
  const interviewRepo = dataSource.getRepository(InterviewEntity);
  const existing = await interviewRepo.count({ where: { organizationId } });
  if (existing >= INTERVIEW_SKIP_THRESHOLD) return;

  const eligible = applications.filter((a) =>
    [
      PipelineStageCategory.INTERVIEW,
      PipelineStageCategory.OFFER,
      PipelineStageCategory.HIRED,
    ].includes(categoryByKey.get(a.stage)!),
  );
  if (eligible.length === 0 || userIds.length === 0) return;

  const pastFloor = NOW - 30 * DAY;
  const rows: Array<DeepPartial<InterviewEntity>> = [];
  let cursor = 0;
  while (rows.length < INTERVIEW_TARGET) {
    const app = eligible[cursor % eligible.length];
    cursor++;
    const category = categoryByKey.get(app.stage)!;
    const round = Math.floor((cursor - 1) / eligible.length);
    const inInterview = category === PipelineStageCategory.INTERVIEW;
    const upcoming = inInterview && (round > 0 || chance(0.45));
    const start = Math.max(pastFloor, new Date(app.appliedAt).getTime() + DAY);
    const scheduledAt = upcoming
      ? at(NOW + int(1, 14) * DAY)
      : at(start + rand() * Math.max(DAY, NOW - DAY - start));
    if (!upcoming && scheduledAt.getTime() > NOW - 2 * 3600 * 1000) {
      scheduledAt.setTime(NOW - int(1, 5) * DAY);
    }

    let status = InterviewStatus.SCHEDULED;
    let cancelledReason: string | null = null;
    if (!upcoming) {
      const roll = rand();
      if (!inInterview || roll < 0.55) status = InterviewStatus.COMPLETED;
      else if (roll < 0.72) status = InterviewStatus.NO_SHOW;
      else if (roll < 0.86) {
        status = InterviewStatus.CANCELLED;
        cancelledReason = pick(CANCEL_REASONS);
      }
    }

    const format = pick(INTERVIEW_FORMATS);
    const remote = [
      InterviewType.VIDEO,
      InterviewType.PHONE,
      InterviewType.TECHNICAL,
    ].includes(format.type);
    const panel = [
      ...new Set(
        [
          app.recruiterId,
          app.hiringManagerId,
          ...pickMany(userIds, int(1, 2)),
        ].filter((id): id is string => !!id && userIds.includes(id)),
      ),
    ].slice(0, int(1, 3));
    rows.push({
      organizationId,
      applicationId: app.id,
      candidateId: app.candidateId,
      jobId: app.jobId,
      title: `${format.title} with ${app.firstName}`,
      type: format.type,
      scheduledAt,
      durationMinutes: pick([30, 45, 60, 60, 90]),
      timezone,
      location: remote ? null : (app.location ?? 'Client office'),
      meetingUrl:
        format.type === InterviewType.PHONE
          ? null
          : remote
            ? `https://meet.example.com/${meetingCode()}`
            : null,
      interviewerIds: panel.length > 0 ? panel : [pick(userIds)],
      organizerId: app.recruiterId ?? context.adminUserId,
      status,
      notes: chance(0.4)
        ? 'Please bring photo ID and proof of right to work.'
        : null,
      cancelledReason,
      createdAt: new Date(
        Math.min(scheduledAt.getTime() - int(2, 6) * DAY, NOW - DAY),
      ),
    });
  }
  const interviews = await interviewRepo.save(
    rows.map((r) => interviewRepo.create(r)),
    { chunk: 50 },
  );

  const scorecardRepo = dataSource.getRepository(ScorecardEntity);
  const scorecards: Array<DeepPartial<ScorecardEntity>> = [];
  for (const interview of interviews) {
    if (interview.status !== InterviewStatus.COMPLETED) continue;
    if (chance(0.15)) continue;
    const appCategory = categoryByKey.get(
      applications.find((a) => a.id === interview.applicationId)!.stage,
    );
    const strong = appCategory !== PipelineStageCategory.INTERVIEW;
    for (const interviewerId of interview.interviewerIds) {
      if (interview.interviewerIds.length > 1 && chance(0.15)) continue;
      const overall = strong ? int(4, 5) : int(2, 5);
      const criteria: ScorecardCriterion[] = pickMany(CRITERIA, int(3, 5)).map(
        (name) => ({
          name,
          rating: Math.min(5, Math.max(1, overall + int(-1, 1))),
          note: chance(0.3) ? 'Good examples given' : null,
        }),
      );
      const recommendation = recommendationFor(overall);
      scorecards.push({
        organizationId,
        interviewId: interview.id,
        applicationId: interview.applicationId,
        interviewerId,
        overallRating: overall,
        recommendation,
        criteria,
        summary: pick(SCORECARD_SUMMARIES[recommendation]),
        submittedAt: new Date(
          new Date(interview.scheduledAt).getTime() + int(1, 30) * 3600 * 1000,
        ),
      });
    }
  }
  await scorecardRepo.save(
    scorecards.map((s) => scorecardRepo.create(s)),
    { chunk: 50 },
  );

  const activityRepo = dataSource.getRepository(ActivityEntity);
  const clientByApp = new Map(applications.map((a) => [a.id, a.clientId]));
  await activityRepo.save(
    interviews.map((interview) =>
      activityRepo.create({
        organizationId,
        candidateId: interview.candidateId,
        applicationId: interview.applicationId,
        jobId: interview.jobId,
        clientId: clientByApp.get(interview.applicationId) ?? null,
        type: ActivityType.INTERVIEW,
        title: `Interview scheduled: ${interview.title}`,
        metadata: {
          kind: 'interview',
          event: 'scheduled',
          interviewId: interview.id,
          interviewTitle: interview.title,
          scheduledAt: interview.scheduledAt,
          type: interview.type,
        },
        actorId: interview.organizerId,
        createdAt: interview.createdAt,
      }),
    ),
    { chunk: 50 },
  );
  console.log(
    `Created ${interviews.length} interviews and ${scorecards.length} scorecards`,
  );
}

interface OfferPlan {
  status: OfferStatus;
  categories: PipelineStageCategory[];
  count: number;
}

const OFFER_PLAN: OfferPlan[] = [
  {
    status: OfferStatus.ACCEPTED,
    categories: [PipelineStageCategory.HIRED],
    count: 8,
  },
  {
    status: OfferStatus.SENT,
    categories: [PipelineStageCategory.OFFER],
    count: 3,
  },
  {
    status: OfferStatus.APPROVED,
    categories: [PipelineStageCategory.OFFER],
    count: 2,
  },
  {
    status: OfferStatus.PENDING_APPROVAL,
    categories: [PipelineStageCategory.OFFER],
    count: 2,
  },
  {
    status: OfferStatus.DRAFT,
    categories: [PipelineStageCategory.OFFER, PipelineStageCategory.INTERVIEW],
    count: 2,
  },
  {
    status: OfferStatus.REJECTED,
    categories: [PipelineStageCategory.OFFER],
    count: 1,
  },
  {
    status: OfferStatus.DECLINED,
    categories: [PipelineStageCategory.WITHDRAWN],
    count: 1,
  },
  {
    status: OfferStatus.WITHDRAWN,
    categories: [PipelineStageCategory.REJECTED],
    count: 1,
  },
  {
    status: OfferStatus.EXPIRED,
    categories: [PipelineStageCategory.WITHDRAWN],
    count: 1,
  },
];

const RATE_PERIOD: Record<string, SalaryPeriod> = {
  hour: SalaryPeriod.HOUR,
  day: SalaryPeriod.DAY,
  year: SalaryPeriod.YEAR,
};

const dateOnly = (time: number) => new Date(time).toISOString().slice(0, 10);

async function seedOffers(
  dataSource: DataSource,
  context: SeedAtsContext,
  applications: SeedApplication[],
  categoryByKey: Map<string, PipelineStageCategory>,
  userIds: string[],
  currency: string,
): Promise<void> {
  const { organizationId, adminUserId } = context;
  const offerRepo = dataSource.getRepository(OfferEntity);
  const existing = await offerRepo.count({ where: { organizationId } });
  if (existing >= OFFER_SKIP_THRESHOLD) return;

  const used = new Set<string>();
  const rows: Array<DeepPartial<OfferEntity>> = [];
  for (const plan of OFFER_PLAN) {
    const pool = applications.filter(
      (a) =>
        !used.has(a.id) &&
        plan.categories.includes(categoryByKey.get(a.stage)!),
    );
    for (const app of pool.slice(-plan.count)) {
      used.add(app.id);
      const permanent = app.employmentType === EmploymentType.PERMANENT;
      const salaryPeriod = permanent
        ? SalaryPeriod.YEAR
        : (RATE_PERIOD[app.rateUnit ?? 'hour'] ?? SalaryPeriod.HOUR);
      const salaryAmount = permanent
        ? (app.salaryMax ?? int(26, 60) * 1000)
        : (app.payRate ?? int(12, 25));
      const approverIds = [
        ...new Set(
          [app.hiringManagerId, adminUserId].filter(
            (id): id is string => !!id && userIds.includes(id),
          ),
        ),
      ];
      const decisionBase = Math.max(
        new Date(app.appliedAt).getTime() + 3 * DAY,
        NOW - 25 * DAY,
      );
      const createdAt =
        plan.status === OfferStatus.ACCEPTED
          ? new Date(
              Math.max(
                new Date(app.appliedAt).getTime() + DAY,
                new Date(app.stageChangedAt).getTime() - int(3, 8) * DAY,
              ),
            )
          : new Date(Math.min(decisionBase + rand() * 10 * DAY, NOW - DAY));
      const decided = (offset: number) =>
        new Date(createdAt.getTime() + offset * 3600 * 1000).toISOString();
      const approved: OfferApproval[] = approverIds.map((userId, i) => ({
        userId,
        decision: OfferDecision.APPROVED,
        comment: i === 0 ? 'Within budget, approved' : null,
        decidedAt: decided(4 + i * 6),
      }));
      let approvals: OfferApproval[] = [];
      let sentAt: Date | null = null;
      let respondedAt: Date | null = null;
      let declineReason: string | null = null;
      const sentTime = () =>
        new Date(
          Math.min(createdAt.getTime() + int(1, 2) * DAY, NOW - 3600_000),
        );
      switch (plan.status) {
        case OfferStatus.PENDING_APPROVAL:
          approvals = approved.slice(0, approverIds.length > 1 ? 1 : 0);
          break;
        case OfferStatus.REJECTED:
          approvals = [
            {
              userId: approverIds[0] ?? adminUserId,
              decision: OfferDecision.REJECTED,
              comment: 'Salary is above the agreed band, please revise',
              decidedAt: decided(5),
            },
          ];
          break;
        case OfferStatus.APPROVED:
          approvals = approved;
          break;
        case OfferStatus.SENT:
        case OfferStatus.EXPIRED:
          approvals = approved;
          sentAt = sentTime();
          break;
        case OfferStatus.ACCEPTED:
          approvals = approved;
          sentAt = sentTime();
          respondedAt = new Date(
            Math.min(
              new Date(app.stageChangedAt).getTime(),
              sentAt.getTime() + int(1, 3) * DAY,
            ),
          );
          if (respondedAt < sentAt)
            respondedAt = new Date(sentAt.getTime() + 3600_000);
          break;
        case OfferStatus.DECLINED:
          approvals = approved;
          sentAt = sentTime();
          respondedAt = new Date(Math.min(sentAt.getTime() + 2 * DAY, NOW));
          declineReason = pick(DECLINE_REASONS);
          break;
        case OfferStatus.WITHDRAWN:
          declineReason = 'Client put the role on hold';
          break;
        default:
          break;
      }
      const startDate = dateOnly(createdAt.getTime() + int(21, 45) * DAY);
      const expiresAt =
        plan.status === OfferStatus.EXPIRED
          ? dateOnly(NOW - int(2, 6) * DAY)
          : dateOnly(createdAt.getTime() + 10 * DAY);
      const salaryText = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
      }).format(salaryAmount);
      rows.push({
        organizationId,
        applicationId: app.id,
        candidateId: app.candidateId,
        jobId: app.jobId,
        status: plan.status,
        title: app.jobTitle,
        salaryAmount,
        currency,
        salaryPeriod,
        bonus: permanent && chance(0.5) ? '10% annual performance bonus' : null,
        equity: null,
        startDate,
        expiresAt,
        employmentType: app.employmentType,
        location: app.location,
        body: `Hi ${app.firstName},\n\nWe are delighted to offer you the ${app.jobTitle} role at ${salaryText} per ${salaryPeriod}, starting on ${startDate}.\n\nPlease let us know your decision by ${expiresAt}.\n\nKind regards,\nThe recruitment team`,
        approverIds,
        approvals,
        sentAt,
        respondedAt,
        declineReason,
        createdBy: app.recruiterId ?? adminUserId,
        createdAt,
      });
    }
  }
  const offers = await offerRepo.save(
    rows.map((r) => offerRepo.create(r)),
    { chunk: 50 },
  );

  const activityRepo = dataSource.getRepository(ActivityEntity);
  const clientByApp = new Map(applications.map((a) => [a.id, a.clientId]));
  const activities: Array<DeepPartial<ActivityEntity>> = [];
  for (const offer of offers) {
    const base = {
      organizationId,
      candidateId: offer.candidateId,
      applicationId: offer.applicationId,
      jobId: offer.jobId,
      clientId: clientByApp.get(offer.applicationId) ?? null,
      type: ActivityType.OFFER,
      actorId: offer.createdBy,
    };
    const meta = (event: string, status: OfferStatus) => ({
      kind: 'offer',
      event,
      offerId: offer.id,
      offerTitle: offer.title,
      status,
    });
    activities.push({
      ...base,
      title: `Offer drafted: ${offer.title}`,
      metadata: meta('created', OfferStatus.DRAFT),
      createdAt: offer.createdAt,
    });
    if (offer.sentAt) {
      activities.push({
        ...base,
        title: `Offer sent to candidate: ${offer.title}`,
        metadata: meta('sent', OfferStatus.SENT),
        createdAt: offer.sentAt,
      });
    }
    if (offer.respondedAt) {
      const accepted = offer.status === OfferStatus.ACCEPTED;
      activities.push({
        ...base,
        title: accepted
          ? `Offer accepted: ${offer.title}`
          : `Offer declined: ${offer.title}`,
        body: offer.declineReason,
        metadata: meta(offer.status, offer.status),
        createdAt: offer.respondedAt,
      });
    }
  }
  await activityRepo.save(
    activities.map((a) => activityRepo.create(a)),
    { chunk: 50 },
  );
  const byStatus = offers.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(
    `Created ${offers.length} offers (${Object.entries(byStatus)
      .map(([s, n]) => `${s}: ${n}`)
      .join(', ')})`,
  );
}

export async function seedAtsPhase2b(
  dataSource: DataSource,
  context: SeedAtsContext,
): Promise<void> {
  const { organizationId } = context;
  const organization = await dataSource
    .getRepository(OrganizationEntity)
    .findOne({ where: { id: organizationId }, select: ['id', 'atsSettings'] });
  const settings = resolveAtsSettings(organization?.atsSettings);
  const stages = await dataSource.getRepository(PipelineStageEntity).find({
    where: { organizationId },
    order: { order: 'ASC' },
  });
  const categoryByKey = new Map(stages.map((s) => [s.key, s.category]));
  const users: Array<{ id: string }> = await dataSource.query(
    `SELECT id FROM users WHERE "organizationId" = $1 AND status = $2 ORDER BY email`,
    [organizationId, UserStatus.ACTIVE],
  );
  const userIds = users.map((u) => u.id);

  await seedStageHistory(dataSource, organizationId, stages);
  const applications = await loadApplications(dataSource, organizationId);
  await seedInterviews(
    dataSource,
    context,
    applications,
    categoryByKey,
    userIds,
    settings.timezone,
  );
  await seedOffers(
    dataSource,
    context,
    applications,
    categoryByKey,
    userIds,
    settings.defaultCurrency,
  );

  const [counts]: Array<{
    interviews: string;
    scorecards: string;
    offers: string;
  }> = await dataSource.query(
    `SELECT
       (SELECT COUNT(*) FROM interviews WHERE "organizationId" = $1) AS interviews,
       (SELECT COUNT(*) FROM interview_scorecards WHERE "organizationId" = $1) AS scorecards,
       (SELECT COUNT(*) FROM offers WHERE "organizationId" = $1) AS offers`,
    [organizationId],
  );
  console.log(
    `ATS phase 2b seed complete: ${counts.interviews} interviews, ${counts.scorecards} scorecards, ${counts.offers} offers`,
  );
}
