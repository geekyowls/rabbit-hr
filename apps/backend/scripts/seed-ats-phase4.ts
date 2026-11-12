import 'reflect-metadata';
import { randomBytes } from 'crypto';
import { DataSource, DeepPartial, IsNull, Not } from 'typeorm';
import {
  ActivityEntity,
  ApplicationEntity,
  CandidateDocumentEntity,
  CandidateEntity,
  InterviewBookingLinkEntity,
  InterviewEntity,
  JobEntity,
  OfferEntity,
  OrganizationEntity,
  PipelineStageEntity,
  RoleEntity,
  UserEntity,
  resolveAtsSettings,
} from '../src/database/entities';
import {
  ActivityType,
  CandidateSource,
  DocumentType,
  DocumentVerificationStatus,
  InterviewBookingLinkStatus,
  InterviewStatus,
  InterviewType,
  JobStatus,
  OfferStatus,
  PipelineStageCategory,
  SalaryPeriod,
} from '../src/database/enums';
import AppDataSource from '../src/database/data-source';
import type { SeedAtsContext } from './seed-ats';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.now();
const SEED_TAG = 'phase4-portal';

const DEMO_CANDIDATE = {
  email: 'maya.portal@example.com',
  firstName: 'Maya',
  lastName: 'Fernandes',
  phone: '+447700900456',
  location: 'Manchester',
  headline: 'Operations coordinator with five years in logistics',
  linkedinUrl: 'https://www.linkedin.com/in/maya-fernandes-demo',
};

const PORTAL_SETTINGS = {
  portalEnabled: true,
  portalWelcomeMessage:
    'Welcome to your candidate portal. Track your applications, book interviews and share documents with our team.',
  brandColor: '#3F6650',
};

type Plan = 'interview' | 'offer' | 'withdrawn' | 'applied';

const PLANS: Plan[] = ['interview', 'offer', 'withdrawn', 'applied'];

function at(offsetMs: number): Date {
  return new Date(NOW + offsetMs);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function enablePortal(dataSource: DataSource, organizationId: string) {
  const repo = dataSource.getRepository(OrganizationEntity);
  const organization = await repo.findOne({
    where: { id: organizationId },
    select: ['id', 'atsSettings'],
  });
  if (!organization) return;
  const stored = organization.atsSettings ?? {};
  const current = resolveAtsSettings(stored);
  await repo.update(
    { id: organizationId },
    {
      atsSettings: {
        ...current,
        portalEnabled: true,
        portalWelcomeMessage:
          stored.portalWelcomeMessage || PORTAL_SETTINGS.portalWelcomeMessage,
        brandColor: stored.brandColor ?? PORTAL_SETTINGS.brandColor,
      },
    },
  );
}

async function stageKeyFor(
  dataSource: DataSource,
  organizationId: string,
  category: PipelineStageCategory,
): Promise<{ key: string; name: string }> {
  const stage = await dataSource.getRepository(PipelineStageEntity).findOne({
    where: { organizationId, category, isActive: true },
    order: { order: 'ASC' },
  });
  return stage
    ? { key: stage.key, name: stage.name }
    : { key: category, name: category };
}

async function ensureDemoCandidate(
  dataSource: DataSource,
  organizationId: string,
  ownerId: string,
): Promise<CandidateEntity> {
  const repo = dataSource.getRepository(CandidateEntity);
  const existing = await repo.findOne({
    where: { organizationId, email: DEMO_CANDIDATE.email },
  });
  if (existing) return existing;
  return repo.save(
    repo.create({
      organizationId,
      ...DEMO_CANDIDATE,
      currentTitle: 'Operations coordinator',
      currentEmployer: 'Northline Freight',
      yearsExperience: 5,
      skills: ['Scheduling', 'Inventory', 'Stakeholder management'],
      source: CandidateSource.CAREERS_PAGE,
      gdprConsentAt: at(-21 * DAY),
      ownerId,
      createdAt: at(-21 * DAY),
    }),
  );
}

async function ensureApplications(
  dataSource: DataSource,
  organizationId: string,
  candidate: CandidateEntity,
  ownerId: string,
): Promise<Map<Plan, { application: ApplicationEntity; job: JobEntity }>> {
  const appRepo = dataSource.getRepository(ApplicationEntity);
  const jobRepo = dataSource.getRepository(JobEntity);
  const activityRepo = dataSource.getRepository(ActivityEntity);
  const existing = await appRepo.find({
    where: { organizationId, candidateId: candidate.id },
    relations: { job: true },
    order: { appliedAt: 'ASC' },
  });
  const markers: Array<{ applicationId: string; plan: Plan }> =
    await dataSource.query(
      `SELECT "applicationId", metadata->>'plan' AS plan FROM activities
       WHERE "organizationId" = $1 AND "candidateId" = $2 AND metadata->>'seed' = $3 AND metadata->>'plan' IS NOT NULL`,
      [organizationId, candidate.id, SEED_TAG],
    );
  const planByApplication = new Map(
    markers.map((m) => [m.applicationId, m.plan]),
  );
  const usedJobIds = new Set(existing.map((a) => a.jobId));
  const jobs = await jobRepo.find({
    where: { organizationId, status: JobStatus.PUBLISHED },
    order: { publishedAt: 'DESC' },
    take: 20,
  });
  const freeJobs = jobs.filter((j) => !usedJobIds.has(j.id));

  const applied = await stageKeyFor(
    dataSource,
    organizationId,
    PipelineStageCategory.APPLIED,
  );
  const screening = await stageKeyFor(
    dataSource,
    organizationId,
    PipelineStageCategory.SCREENING,
  );
  const target: Record<Plan, PipelineStageCategory> = {
    interview: PipelineStageCategory.INTERVIEW,
    offer: PipelineStageCategory.OFFER,
    withdrawn: PipelineStageCategory.WITHDRAWN,
    applied: PipelineStageCategory.APPLIED,
  };

  const result = new Map<
    Plan,
    { application: ApplicationEntity; job: JobEntity }
  >();
  for (const [index, plan] of PLANS.entries()) {
    const found = existing.find((a) => planByApplication.get(a.id) === plan);
    if (found) {
      result.set(plan, { application: found, job: found.job });
      continue;
    }
    const job = freeJobs.shift();
    if (!job) break;
    const stage = await stageKeyFor(dataSource, organizationId, target[plan]);
    const appliedAt = at(-(18 - index * 3) * DAY);
    const stageChangedAt = at(-(6 - index) * DAY);
    if (plan === 'applied') {
      await jobRepo.update(
        { id: job.id },
        {
          requiredDocuments: [
            ...new Set([
              ...job.requiredDocuments,
              DocumentType.CV,
              DocumentType.RIGHT_TO_WORK,
              DocumentType.REFERENCE,
            ]),
          ],
        },
      );
    }
    const application = await appRepo.save(
      appRepo.create({
        organizationId,
        candidateId: candidate.id,
        jobId: job.id,
        stage: stage.key,
        source: CandidateSource.CAREERS_PAGE,
        answers: [],
        appliedAt,
        stageChangedAt: plan === 'applied' ? appliedAt : stageChangedAt,
        ownerId,
      }),
    );

    const activities: DeepPartial<ActivityEntity>[] = [
      {
        organizationId,
        candidateId: candidate.id,
        applicationId: application.id,
        jobId: job.id,
        clientId: job.clientId,
        type: ActivityType.CREATED,
        title: `Applied for ${job.title} via careers page`,
        metadata: {
          source: CandidateSource.CAREERS_PAGE,
          seed: SEED_TAG,
          plan,
        },
        actorId: null,
        createdAt: appliedAt,
      },
    ];
    if (plan !== 'applied') {
      activities.push({
        organizationId,
        candidateId: candidate.id,
        applicationId: application.id,
        jobId: job.id,
        clientId: job.clientId,
        type: ActivityType.STAGE_CHANGE,
        title: `Moved from ${applied.name} to ${screening.name}`,
        metadata: {
          from: applied.key,
          to: screening.key,
          toCategory: PipelineStageCategory.SCREENING,
          jobTitle: job.title,
          seed: SEED_TAG,
        },
        actorId: ownerId,
        createdAt: new Date(appliedAt.getTime() + 2 * DAY),
      });
      activities.push({
        organizationId,
        candidateId: candidate.id,
        applicationId: application.id,
        jobId: job.id,
        clientId: job.clientId,
        type: ActivityType.STAGE_CHANGE,
        title: `Moved from ${screening.name} to ${stage.name}`,
        body:
          plan === 'withdrawn'
            ? 'Withdrawn by the candidate from the portal'
            : null,
        metadata: {
          from: screening.key,
          to: stage.key,
          toCategory: target[plan],
          jobTitle: job.title,
          seed: SEED_TAG,
        },
        actorId: plan === 'withdrawn' ? null : ownerId,
        createdAt: stageChangedAt,
      });
    }
    if (plan === 'withdrawn') {
      activities.push({
        organizationId,
        candidateId: candidate.id,
        applicationId: application.id,
        jobId: job.id,
        clientId: job.clientId,
        type: ActivityType.PORTAL,
        title: `Candidate withdrew application for ${job.title}`,
        body: 'I have accepted another role closer to home',
        metadata: { source: 'portal', action: 'withdraw', seed: SEED_TAG },
        actorId: null,
        createdAt: new Date(stageChangedAt.getTime() + 1000),
      });
    }
    await activityRepo.save(activityRepo.create(activities));
    result.set(plan, { application, job });
  }
  return result;
}

async function ensureInterviews(
  dataSource: DataSource,
  organizationId: string,
  candidateId: string,
  entry: { application: ApplicationEntity; job: JobEntity } | undefined,
  organizerId: string,
) {
  if (!entry) return;
  const repo = dataSource.getRepository(InterviewEntity);
  if (await repo.exists({ where: { applicationId: entry.application.id } })) {
    return;
  }
  const base = {
    organizationId,
    applicationId: entry.application.id,
    candidateId,
    jobId: entry.job.id,
    timezone: 'Europe/London',
    interviewerIds: [organizerId],
    organizerId,
  };
  await repo.save([
    repo.create({
      ...base,
      title: 'Phone screen',
      type: InterviewType.PHONE,
      scheduledAt: at(-5 * DAY),
      durationMinutes: 30,
      status: InterviewStatus.COMPLETED,
      notes: 'Internal: strong communicator, keen on hybrid working',
    }),
    repo.create({
      ...base,
      title: `Interview for ${entry.job.title}`,
      type: InterviewType.ONSITE,
      scheduledAt: new Date(
        Math.floor((NOW + 3 * DAY) / DAY) * DAY + 10 * HOUR,
      ),
      durationMinutes: 60,
      location: '1 Spinningfields Square, Manchester M3 3AP',
      status: InterviewStatus.SCHEDULED,
    }),
  ]);
}

async function ensureOffer(
  dataSource: DataSource,
  organizationId: string,
  candidate: CandidateEntity,
  entry: { application: ApplicationEntity; job: JobEntity } | undefined,
  createdBy: string,
) {
  if (!entry) return;
  const repo = dataSource.getRepository(OfferEntity);
  if (await repo.exists({ where: { applicationId: entry.application.id } })) {
    return;
  }
  const sentAt = at(-2 * DAY);
  const expires = at(12 * DAY);
  const salary = entry.job.salaryMax ?? entry.job.salaryMin ?? 38000;
  await repo.save(
    repo.create({
      organizationId,
      applicationId: entry.application.id,
      candidateId: candidate.id,
      jobId: entry.job.id,
      status: OfferStatus.SENT,
      title: entry.job.title,
      salaryAmount: salary,
      currency: entry.job.currency || 'GBP',
      salaryPeriod: SalaryPeriod.YEAR,
      startDate: isoDate(at(30 * DAY)),
      expiresAt: isoDate(expires),
      employmentType: entry.job.employmentType,
      location: entry.job.location,
      approverIds: [],
      approvals: [],
      sentAt,
      signToken: randomBytes(32).toString('hex'),
      signTokenExpiresAt: new Date(`${isoDate(expires)}T23:59:59.999Z`),
      sentLetterBody: `Dear ${candidate.firstName},\n\nWe are delighted to offer you the ${entry.job.title} role.\n\nPlease review the details and sign online.\n\nKind regards`,
      createdBy,
    }),
  );
}

async function ensureBookingLink(
  dataSource: DataSource,
  organizationId: string,
  candidateId: string,
  entry: { application: ApplicationEntity; job: JobEntity } | undefined,
  createdBy: string,
) {
  if (!entry) return;
  const repo = dataSource.getRepository(InterviewBookingLinkEntity);
  if (await repo.exists({ where: { applicationId: entry.application.id } })) {
    return;
  }
  await repo.save(
    repo.create({
      organizationId,
      applicationId: entry.application.id,
      candidateId,
      jobId: entry.job.id,
      token: randomBytes(24).toString('hex'),
      title: 'Introductory call',
      type: InterviewType.PHONE,
      durationMinutes: 30,
      interviewerIds: [createdBy],
      expiresAt: at(7 * DAY),
      status: InterviewBookingLinkStatus.OPEN,
      createdBy,
    }),
  );
}

async function ensureDocuments(
  dataSource: DataSource,
  organizationId: string,
  candidate: CandidateEntity,
  verifierId: string,
) {
  const repo = dataSource.getRepository(CandidateDocumentEntity);
  const activityRepo = dataSource.getRepository(ActivityEntity);
  if (await repo.exists({ where: { candidateId: candidate.id } })) return;
  const prefix = `organizations/${organizationId}/portal/${candidate.id}/`;
  const cv = await repo.save(
    repo.create({
      organizationId,
      candidateId: candidate.id,
      type: DocumentType.CV,
      name: 'CV',
      fileKey: `${prefix}demo-maya-fernandes-cv.pdf`,
      fileName: 'Maya_Fernandes_CV.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 182_400,
      verificationStatus: DocumentVerificationStatus.PENDING,
      createdAt: at(-3 * DAY),
    }),
  );
  await repo.save(
    repo.create({
      organizationId,
      candidateId: candidate.id,
      type: DocumentType.ID,
      name: 'Passport',
      fileKey: `${prefix}demo-maya-fernandes-passport.jpg`,
      fileName: 'passport.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 640_000,
      verificationStatus: DocumentVerificationStatus.VERIFIED,
      verifiedBy: verifierId,
      verifiedAt: at(-1 * DAY),
      createdAt: at(-2 * DAY),
    }),
  );
  await dataSource
    .getRepository(CandidateEntity)
    .update(
      { id: candidate.id },
      { cvFileKey: cv.fileKey, cvFileName: cv.fileName },
    );
  await activityRepo.save(
    activityRepo.create([
      {
        organizationId,
        candidateId: candidate.id,
        type: ActivityType.DOCUMENT,
        title: 'Candidate uploaded a document: CV',
        metadata: {
          source: 'portal',
          documentId: cv.id,
          documentType: DocumentType.CV,
          seed: SEED_TAG,
        },
        actorId: null,
        createdAt: at(-3 * DAY),
      },
      {
        organizationId,
        candidateId: candidate.id,
        type: ActivityType.DOCUMENT,
        title: 'Candidate uploaded a document: Passport',
        metadata: {
          source: 'portal',
          documentType: DocumentType.ID,
          seed: SEED_TAG,
        },
        actorId: null,
        createdAt: at(-2 * DAY),
      },
      {
        organizationId,
        candidateId: candidate.id,
        type: ActivityType.PORTAL,
        title: 'Candidate updated profile',
        body: 'Updated phone, headline',
        metadata: {
          source: 'portal',
          action: 'profile_update',
          fields: ['phone', 'headline'],
          seed: SEED_TAG,
        },
        actorId: null,
        createdAt: at(-2 * DAY + HOUR),
      },
    ] as DeepPartial<ActivityEntity>[]),
  );
}

async function seedPortalLogins(
  dataSource: DataSource,
  organizationId: string,
  demoCandidateId: string,
) {
  const repo = dataSource.getRepository(CandidateEntity);
  await repo.update(
    { id: demoCandidateId, portalLastLoginAt: IsNull() },
    { portalInvitedAt: at(-6 * DAY), portalLastLoginAt: at(-2 * HOUR) },
  );
  const already = await repo.count({
    where: {
      organizationId,
      portalLastLoginAt: Not(IsNull()),
      id: Not(demoCandidateId),
    },
  });
  if (already > 0) return;
  const others = await repo.find({
    where: { organizationId, email: Not(DEMO_CANDIDATE.email) },
    select: ['id'],
    order: { createdAt: 'DESC' },
    take: 4,
  });
  for (const [index, candidate] of others.entries()) {
    await repo.update(
      { id: candidate.id },
      {
        portalInvitedAt: at(-(10 + index) * DAY),
        portalLastLoginAt: at(-(index + 1) * DAY - index * 3 * HOUR),
      },
    );
  }
}

export async function seedAtsPhase4(
  dataSource: DataSource,
  context: SeedAtsContext,
): Promise<void> {
  const { organizationId, adminUserId } = context;
  await enablePortal(dataSource, organizationId);
  const candidate = await ensureDemoCandidate(
    dataSource,
    organizationId,
    adminUserId,
  );
  const plans = await ensureApplications(
    dataSource,
    organizationId,
    candidate,
    adminUserId,
  );
  await ensureInterviews(
    dataSource,
    organizationId,
    candidate.id,
    plans.get('interview'),
    adminUserId,
  );
  await ensureOffer(
    dataSource,
    organizationId,
    candidate,
    plans.get('offer'),
    adminUserId,
  );
  await ensureBookingLink(
    dataSource,
    organizationId,
    candidate.id,
    plans.get('applied'),
    adminUserId,
  );
  await ensureDocuments(dataSource, organizationId, candidate, adminUserId);
  await seedPortalLogins(dataSource, organizationId, candidate.id);
  console.log(
    `Seeded candidate portal demo: ${DEMO_CANDIDATE.email} with ${plans.size} applications`,
  );
}

async function run() {
  await AppDataSource.initialize();
  const admin = await AppDataSource.getRepository(UserEntity).findOne({
    where: { email: 'admin@rabbithr.test' },
  });
  if (!admin) {
    throw new Error('Run the main seed first');
  }
  const role = await AppDataSource.getRepository(RoleEntity).findOne({
    where: { organizationId: admin.organizationId, isDefault: true },
  });
  await seedAtsPhase4(AppDataSource, {
    organizationId: admin.organizationId,
    adminUserId: admin.id,
    adminRoleId: role?.id ?? admin.roleId ?? '',
  });
  await AppDataSource.destroy();
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Phase 4 seed failed:', error);
    process.exit(1);
  });
}
