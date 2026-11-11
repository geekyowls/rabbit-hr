import { randomBytes } from 'crypto';
import { DataSource, DeepPartial, In } from 'typeorm';
import {
  InterviewBookingLinkEntity,
  InterviewerAvailabilityEntity,
  OrganizationEntity,
  UserTimeOffEntity,
  resolveAtsSettings,
} from '../src/database/entities';
import {
  InterviewBookingLinkStatus,
  InterviewBookingMode,
  InterviewMeetingProvider,
  InterviewType,
  PipelineStageCategory,
} from '../src/database/enums';
import { SeedAtsContext } from './seed-ats';

const DAY = 24 * 60 * 60 * 1000;
const BOOKING_LINK_TARGET = 8;
const WEEKDAY_HOURS = [1, 2, 3, 4, 5].map((day) => ({
  day,
  start: '09:00',
  end: '17:00',
}));

interface InterviewStageApplication {
  id: string;
  candidateId: string;
  jobId: string;
  jobTitle: string;
  recruiterId: string | null;
  hiringManagerId: string | null;
  interviewId: string | null;
}

const startOfUtcDay = (offsetDays: number) => {
  const date = new Date(Date.now() + offsetDays * DAY);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

async function seedAvailability(
  dataSource: DataSource,
  organizationId: string,
  timezone: string,
  userIds: string[],
): Promise<void> {
  const repo = dataSource.getRepository(InterviewerAvailabilityEntity);
  const existing = await repo.find({
    where: { organizationId, userId: In(userIds) },
    select: ['userId'],
  });
  const have = new Set(existing.map((e) => e.userId));
  const missing = userIds.filter((id) => !have.has(id));
  if (missing.length > 0) {
    await repo.save(
      missing.map((userId) =>
        repo.create({
          organizationId,
          userId,
          timezone,
          weeklyHours: WEEKDAY_HOURS,
          bufferMinutes: 15,
          minNoticeMinutes: 240,
          maxDaysAhead: 30,
        }),
      ),
    );
  }
  console.log(
    `Interviewer availability: ${missing.length} created, ${have.size} kept`,
  );
}

async function seedTimeOff(
  dataSource: DataSource,
  organizationId: string,
  userIds: string[],
): Promise<void> {
  const repo = dataSource.getRepository(UserTimeOffEntity);
  const count = await repo.count({ where: { organizationId } });
  if (count > 0 || userIds.length === 0) {
    console.log(`Time off: ${count} existing, skipped`);
    return;
  }
  const entries: Array<DeepPartial<UserTimeOffEntity>> = [
    {
      userId: userIds[0],
      startsAt: startOfUtcDay(12),
      endsAt: startOfUtcDay(15),
      allDay: true,
      reason: 'Annual leave',
    },
    {
      userId: userIds[1 % userIds.length],
      startsAt: new Date(startOfUtcDay(4).getTime() + 13 * 3600_000),
      endsAt: new Date(startOfUtcDay(4).getTime() + 17 * 3600_000),
      allDay: false,
      reason: 'Client site visit',
    },
    {
      userId: userIds[2 % userIds.length],
      startsAt: startOfUtcDay(20),
      endsAt: startOfUtcDay(21),
      allDay: true,
      reason: 'Training day',
    },
    {
      userId: userIds[0],
      startsAt: new Date(startOfUtcDay(7).getTime() + 9 * 3600_000),
      endsAt: new Date(startOfUtcDay(7).getTime() + 11 * 3600_000),
      allDay: false,
      reason: 'Team planning',
    },
  ];
  await repo.save(
    entries.map((entry) =>
      repo.create({ ...entry, organizationId, createdBy: entry.userId }),
    ),
  );
  console.log(`Time off: ${entries.length} created`);
}

async function loadInterviewStageApplications(
  dataSource: DataSource,
  organizationId: string,
): Promise<InterviewStageApplication[]> {
  return dataSource.query(
    `SELECT a.id, a."candidateId", a."jobId", j.title AS "jobTitle",
            COALESCE(j."recruiterId", j."ownerId") AS "recruiterId", j."hiringManagerId",
            (SELECT i.id FROM interviews i
              WHERE i."applicationId" = a.id AND i.status = 'scheduled'
              ORDER BY i."scheduledAt" DESC LIMIT 1) AS "interviewId"
     FROM applications a
     JOIN jobs j ON j.id = a."jobId"
     JOIN pipeline_stages ps ON ps."organizationId" = a."organizationId" AND ps.key = a.stage
     WHERE a."organizationId" = $1 AND ps.category = $2
     ORDER BY a."stageChangedAt" DESC, a.id
     LIMIT 40`,
    [organizationId, PipelineStageCategory.INTERVIEW],
  );
}

async function seedBookingLinks(
  dataSource: DataSource,
  context: SeedAtsContext,
  applications: InterviewStageApplication[],
): Promise<void> {
  const { organizationId, adminUserId } = context;
  const repo = dataSource.getRepository(InterviewBookingLinkEntity);
  const count = await repo.count({ where: { organizationId } });
  if (count >= BOOKING_LINK_TARGET) {
    console.log(`Booking links: ${count} existing, skipped`);
    return;
  }
  const used = new Set(
    (
      await repo.find({ where: { organizationId }, select: ['applicationId'] })
    ).map((l) => l.applicationId),
  );
  const withInterview = applications.filter(
    (a) => a.interviewId && !used.has(a.id),
  );
  const withoutInterview = applications.filter(
    (a) => !a.interviewId && !used.has(a.id),
  );
  const plan: Array<{
    app: InterviewStageApplication;
    status: InterviewBookingLinkStatus;
  }> = [
    ...withInterview
      .slice(0, 2)
      .map((app) => ({ app, status: InterviewBookingLinkStatus.BOOKED })),
    ...withoutInterview
      .slice(0, 4)
      .map((app) => ({ app, status: InterviewBookingLinkStatus.OPEN })),
    ...withoutInterview
      .slice(4, 6)
      .map((app) => ({ app, status: InterviewBookingLinkStatus.EXPIRED })),
  ].slice(0, BOOKING_LINK_TARGET - count);

  const formats = [
    {
      type: InterviewType.VIDEO,
      title: 'Video interview',
      minutes: 30,
      meeting: InterviewMeetingProvider.GOOGLE_MEET,
    },
    {
      type: InterviewType.PHONE,
      title: 'Phone screen',
      minutes: 20,
      meeting: InterviewMeetingProvider.NONE,
    },
    {
      type: InterviewType.TECHNICAL,
      title: 'Technical interview',
      minutes: 60,
      meeting: InterviewMeetingProvider.TEAMS,
    },
    {
      type: InterviewType.VIDEO,
      title: 'First interview',
      minutes: 45,
      meeting: InterviewMeetingProvider.ZOOM,
    },
  ];

  const rows = plan.map(({ app, status }, index) => {
    const format = formats[index % formats.length];
    const interviewerIds = [
      ...new Set(
        [app.recruiterId, app.hiringManagerId].filter(
          (id): id is string => !!id,
        ),
      ),
    ];
    const createdAt = new Date(Date.now() - (index + 1) * DAY);
    return repo.create({
      organizationId,
      applicationId: app.id,
      candidateId: app.candidateId,
      jobId: app.jobId,
      token: randomBytes(24).toString('base64url'),
      title: format.title,
      type: format.type,
      durationMinutes: format.minutes,
      interviewerIds:
        interviewerIds.length > 0 ? interviewerIds : [adminUserId],
      mode:
        index % 3 === 2 && interviewerIds.length > 1
          ? InterviewBookingMode.ALL_INTERVIEWERS
          : InterviewBookingMode.ANY_INTERVIEWER,
      meetingProvider: format.meeting,
      location: null,
      expiresAt:
        status === InterviewBookingLinkStatus.EXPIRED
          ? new Date(Date.now() - 2 * DAY)
          : new Date(Date.now() + 7 * DAY),
      status,
      bookedInterviewId:
        status === InterviewBookingLinkStatus.BOOKED ? app.interviewId : null,
      bookedAt:
        status === InterviewBookingLinkStatus.BOOKED
          ? new Date(createdAt.getTime() + 3600_000)
          : null,
      createdBy: app.recruiterId ?? adminUserId,
      createdAt,
    });
  });
  if (rows.length > 0) await repo.save(rows);
  console.log(`Booking links: ${rows.length} created`);
}

export async function seedAtsPhase3a(
  dataSource: DataSource,
  context: SeedAtsContext,
): Promise<void> {
  const { organizationId, adminUserId } = context;
  const organization = await dataSource
    .getRepository(OrganizationEntity)
    .findOne({ where: { id: organizationId }, select: ['id', 'atsSettings'] });
  const { timezone } = resolveAtsSettings(organization?.atsSettings);

  const people: Array<{ id: string }> = await dataSource.query(
    `SELECT DISTINCT u.id FROM users u
     WHERE u."organizationId" = $1 AND (
       u.id = $2 OR u.id IN (
         SELECT COALESCE(j."recruiterId", j."ownerId") FROM jobs j WHERE j."organizationId" = $1
         UNION SELECT j."hiringManagerId" FROM jobs j WHERE j."organizationId" = $1
       )
     )
     ORDER BY u.id`,
    [organizationId, adminUserId],
  );
  const userIds = people.map((p) => p.id);

  await seedAvailability(dataSource, organizationId, timezone, userIds);
  await seedTimeOff(
    dataSource,
    organizationId,
    userIds.filter((id) => id !== adminUserId),
  );
  const applications = await loadInterviewStageApplications(
    dataSource,
    organizationId,
  );
  await seedBookingLinks(dataSource, context, applications);
}
