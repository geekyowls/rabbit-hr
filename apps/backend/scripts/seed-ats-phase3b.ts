import { createHash, randomBytes } from 'crypto';
import { DataSource, DeepPartial, In, IsNull, Not } from 'typeorm';
import {
  ActivityEntity,
  CandidateCallEntity,
  JobFeedEntity,
  OfferEntity,
  SupportedIntegrationEntity,
  WhatsappMessageEntity,
  WhatsappTemplateEntity,
  WhatsappVariableSource,
} from '../src/database/entities';
import {
  ActivityType,
  CallDirection,
  CallDisposition,
  CallStatus,
  IntegrationAuthType,
  IntegrationCategory,
  OfferStatus,
  UserStatus,
  WhatsappMessageStatus,
} from '../src/database/enums';
import { mulberry32, SeedAtsContext } from './seed-ats';

const rand = mulberry32(20261113);
const int = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)];

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const CALL_TARGET = 40;
const MESSAGE_TARGET = 30;
const PROVIDER = 'wappcloud';
const ORG_PHONE = '+442071234567';

const INTEGRATIONS = [
  {
    provider: 'plivo',
    name: 'Plivo',
    description: 'Click to call candidates from RabbitHR with call recording',
    iconUrl: '/integrations/plivo.svg',
    category: IntegrationCategory.TELEPHONY,
    authType: IntegrationAuthType.API_KEY,
    sortOrder: 20,
  },
  {
    provider: 'wappcloud',
    name: 'WhatsApp',
    description: 'Send approved WhatsApp templates to candidates via WappCloud',
    iconUrl: '/integrations/whatsapp.svg',
    category: IntegrationCategory.MESSAGING,
    authType: IntegrationAuthType.API_KEY,
    sortOrder: 21,
  },
];

interface SeedCandidate {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  applicationId: string | null;
  jobId: string | null;
  jobTitle: string | null;
  clientId: string | null;
}

const CALL_OUTCOMES: Array<{
  status: CallStatus;
  disposition: CallDisposition;
  connected: boolean;
  weight: number;
}> = [
  {
    status: CallStatus.COMPLETED,
    disposition: CallDisposition.CONNECTED,
    connected: true,
    weight: 6,
  },
  {
    status: CallStatus.COMPLETED,
    disposition: CallDisposition.INTERESTED,
    connected: true,
    weight: 4,
  },
  {
    status: CallStatus.COMPLETED,
    disposition: CallDisposition.CALLBACK_REQUESTED,
    connected: true,
    weight: 2,
  },
  {
    status: CallStatus.COMPLETED,
    disposition: CallDisposition.NOT_INTERESTED,
    connected: true,
    weight: 1,
  },
  {
    status: CallStatus.NO_ANSWER,
    disposition: CallDisposition.NO_ANSWER,
    connected: false,
    weight: 4,
  },
  {
    status: CallStatus.COMPLETED,
    disposition: CallDisposition.VOICEMAIL,
    connected: false,
    weight: 2,
  },
  {
    status: CallStatus.BUSY,
    disposition: CallDisposition.BUSY,
    connected: false,
    weight: 2,
  },
  {
    status: CallStatus.FAILED,
    disposition: CallDisposition.WRONG_NUMBER,
    connected: false,
    weight: 1,
  },
];

const CALL_NOTES: Partial<Record<CallDisposition, string[]>> = {
  [CallDisposition.CONNECTED]: [
    'Talked through the role and shift pattern, happy to proceed',
    'Confirmed work eligibility and availability from next week',
    'Discussed pay rate expectations, within budget',
  ],
  [CallDisposition.INTERESTED]: [
    'Keen on the role, sending CV update tonight',
    'Interested, asked for more detail on the client site',
  ],
  [CallDisposition.CALLBACK_REQUESTED]: [
    'Driving, asked for a call back after 5pm',
    'In a meeting, call back tomorrow morning',
  ],
  [CallDisposition.NOT_INTERESTED]: ['Has accepted another role locally'],
  [CallDisposition.VOICEMAIL]: ['Left a voicemail with role details'],
  [CallDisposition.WRONG_NUMBER]: [
    'Number not recognised, check with candidate by email',
  ],
};

const pickOutcome = () => {
  const total = CALL_OUTCOMES.reduce((sum, o) => sum + o.weight, 0);
  let roll = rand() * total;
  for (const outcome of CALL_OUTCOMES) {
    roll -= outcome.weight;
    if (roll <= 0) return outcome;
  }
  return CALL_OUTCOMES[0];
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
};

const e164 = (phone: string) => phone.replace(/[\s\-().]/g, '');

const TEMPLATES: Array<{
  name: string;
  label: string;
  category: string;
  status: string;
  body: string;
  mapping: Record<string, WhatsappVariableSource>;
}> = [
  {
    name: 'interview_invite',
    label: 'Interview invite',
    category: 'UTILITY',
    status: 'APPROVED',
    body: 'Hi {{1}}, thanks for applying for the {{2}} role. {{3}} would like to arrange an interview, reply here with times that suit you.',
    mapping: {
      'body.1': { type: 'placeholder', key: 'candidate.firstName' },
      'body.2': { type: 'placeholder', key: 'job.title' },
      'body.3': { type: 'placeholder', key: 'recruiter.name' },
    },
  },
  {
    name: 'application_received',
    label: 'Application received',
    category: 'UTILITY',
    status: 'APPROVED',
    body: 'Hi {{1}}, we have received your application for {{2}} at {{3}}. We will be in touch shortly.',
    mapping: {
      'body.1': { type: 'placeholder', key: 'candidate.firstName' },
      'body.2': { type: 'placeholder', key: 'job.title' },
      'body.3': { type: 'placeholder', key: 'company.name' },
    },
  },
  {
    name: 'offer_followup',
    label: 'Offer follow up',
    category: 'UTILITY',
    status: 'APPROVED',
    body: 'Hi {{1}}, your offer for {{2}} is waiting in your inbox. Call {{3}} on {{4}} with any questions.',
    mapping: {
      'body.1': { type: 'placeholder', key: 'candidate.firstName' },
      'body.2': { type: 'placeholder', key: 'job.title' },
      'body.3': { type: 'placeholder', key: 'recruiter.firstName' },
      'body.4': { type: 'placeholder', key: 'company.phone' },
    },
  },
  {
    name: 'shift_reminder',
    label: 'Shift reminder',
    category: 'MARKETING',
    status: 'PENDING',
    body: 'Hi {{1}}, a reminder that your first shift for {{2}} starts soon. Reply YES to confirm.',
    mapping: {
      'body.1': { type: 'placeholder', key: 'candidate.firstName' },
      'body.2': { type: 'text', value: 'your new placement' },
    },
  },
];

const FAILURES = [
  {
    category: 'invalid_number',
    message: 'Contact number is not a valid WhatsApp number',
  },
  { category: 'rate_limited', message: 'Too many requests, try again later' },
  {
    category: 'template_not_approved',
    message: 'Template is not approved for sending',
  },
];

async function seedIntegrations(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(SupportedIntegrationEntity);
  for (const integration of INTEGRATIONS) {
    const existing = await repo.findOne({
      where: { provider: integration.provider },
    });
    if (existing) continue;
    await repo.save(repo.create({ ...integration, isActive: true }));
    console.log(`Created integration: ${integration.name}`);
  }
}

async function loadCandidates(
  dataSource: DataSource,
  organizationId: string,
): Promise<SeedCandidate[]> {
  return dataSource.query(
    `SELECT c.id, c."firstName", c."lastName", c.phone,
            a.id AS "applicationId", a."jobId", j.title AS "jobTitle", j."clientId"
     FROM candidates c
     LEFT JOIN LATERAL (
       SELECT a.id, a."jobId" FROM applications a
       WHERE a."candidateId" = c.id ORDER BY a."appliedAt" DESC LIMIT 1
     ) a ON TRUE
     LEFT JOIN jobs j ON j.id = a."jobId"
     WHERE c."organizationId" = $1 AND c.phone IS NOT NULL
     ORDER BY c.email`,
    [organizationId],
  );
}

async function seedCalls(
  dataSource: DataSource,
  organizationId: string,
  candidates: SeedCandidate[],
  userIds: string[],
): Promise<void> {
  const callRepo = dataSource.getRepository(CandidateCallEntity);
  const existing = await callRepo.count({ where: { organizationId } });
  if (existing >= CALL_TARGET / 2 || candidates.length === 0) return;

  const activityRepo = dataSource.getRepository(ActivityEntity);
  for (let i = existing; i < CALL_TARGET; i++) {
    const candidate = pick(candidates);
    const outcome = pickOutcome();
    const actorId = pick(userIds);
    const startedAt = new Date(NOW - int(1, 75) * DAY - int(0, 9) * 3600_000);
    startedAt.setUTCHours(int(8, 17), int(0, 59), 0, 0);
    const durationSeconds = outcome.connected
      ? int(45, 900)
      : outcome.disposition === CallDisposition.VOICEMAIL
        ? int(20, 60)
        : int(0, 30);
    const billDurationSeconds = outcome.connected ? durationSeconds : 0;
    const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);
    const linkApplication = candidate.applicationId && rand() < 0.6;
    const notes = CALL_NOTES[outcome.disposition];
    const note = notes && rand() < 0.75 ? pick(notes) : null;
    const callUuid = `seed-${randomBytes(12).toString('hex')}`;
    const name = `${candidate.firstName} ${candidate.lastName}`;

    const call = await callRepo.save(
      callRepo.create({
        organizationId,
        candidateId: candidate.id,
        applicationId: linkApplication ? candidate.applicationId : null,
        actorId,
        provider: 'plivo',
        requestUuid: `seed-req-${randomBytes(10).toString('hex')}`,
        callUuid,
        direction: CallDirection.OUTBOUND,
        status: outcome.status,
        hangupCause: outcome.connected
          ? 'NORMAL_CLEARING'
          : outcome.status === CallStatus.BUSY
            ? 'USER_BUSY'
            : outcome.status === CallStatus.FAILED
              ? 'UNALLOCATED_NUMBER'
              : 'NO_ANSWER',
        fromNumber: ORG_PHONE,
        toNumber: e164(candidate.phone),
        staffNumber: `+4479000${String(int(10000, 99999))}`,
        durationSeconds,
        billDurationSeconds,
        startedAt,
        endedAt,
        disposition: outcome.disposition,
        note,
        recordingUrl: outcome.connected
          ? `https://example.com/recordings/${callUuid}.mp3`
          : null,
        recordingDurationSeconds: outcome.connected
          ? Math.max(durationSeconds - int(5, 20), 10)
          : null,
        createdAt: startedAt,
      } as DeepPartial<CandidateCallEntity>),
    );
    const activity = await activityRepo.save(
      activityRepo.create({
        organizationId,
        candidateId: candidate.id,
        applicationId: call.applicationId,
        jobId: linkApplication ? candidate.jobId : null,
        clientId: linkApplication ? candidate.clientId : null,
        type: ActivityType.CALL,
        title: outcome.connected
          ? `Call with ${name} (${formatDuration(durationSeconds)})`
          : `Call to ${name} not connected`,
        body: note,
        metadata: {
          kind: 'call',
          callId: call.id,
          status: call.status,
          disposition: call.disposition,
          durationSeconds,
          direction: call.direction,
        },
        actorId,
        createdAt: endedAt,
      } as DeepPartial<ActivityEntity>),
    );
    await callRepo.update(call.id, { activityId: activity.id });
  }
  console.log(`Seeded ${CALL_TARGET - existing} candidate calls`);
}

async function seedTemplates(
  dataSource: DataSource,
  organizationId: string,
): Promise<WhatsappTemplateEntity[]> {
  const repo = dataSource.getRepository(WhatsappTemplateEntity);
  for (const template of TEMPLATES) {
    const existing = await repo.findOne({
      where: {
        organizationId,
        provider: PROVIDER,
        name: template.name,
        language: 'en',
      },
    });
    if (existing) continue;
    await repo.save(
      repo.create({
        organizationId,
        provider: PROVIDER,
        name: template.name,
        language: 'en',
        label: template.label,
        category: template.category,
        status: template.status,
        body: template.body,
        variableKeys: Object.keys(template.mapping),
        mapping: template.mapping,
        availableAtProvider: true,
        addedManually: false,
        lastSyncedAt: new Date(NOW - 2 * DAY),
      }),
    );
  }
  return repo.find({ where: { organizationId, provider: PROVIDER } });
}

function renderTemplate(
  template: WhatsappTemplateEntity,
  values: Record<string, string>,
) {
  const variables: Record<string, string> = {};
  for (const key of template.variableKeys) {
    const source = template.mapping[key];
    variables[key] =
      source?.type === 'text'
        ? source.value
        : (values[source?.key ?? ''] ?? '');
  }
  const body = (template.body ?? '').replace(
    /\{\{\s*(\d+)\s*\}\}/g,
    (match, n: string) => variables[`body.${n}`] ?? match,
  );
  return { variables, body };
}

async function seedMessages(
  dataSource: DataSource,
  organizationId: string,
  candidates: SeedCandidate[],
  templates: WhatsappTemplateEntity[],
  users: Array<{ id: string; firstName: string; lastName: string }>,
): Promise<void> {
  const messageRepo = dataSource.getRepository(WhatsappMessageEntity);
  const existing = await messageRepo.count({ where: { organizationId } });
  const approved = templates.filter((t) => t.status === 'APPROVED');
  if (existing >= MESSAGE_TARGET / 2 || approved.length === 0) return;

  const [organization] = await dataSource.query(
    `SELECT name, phone FROM organizations WHERE id = $1`,
    [organizationId],
  );
  const withApplication = candidates.filter((c) => c.applicationId);
  const activityRepo = dataSource.getRepository(ActivityEntity);
  for (let i = existing; i < MESSAGE_TARGET; i++) {
    const candidate = pick(
      withApplication.length ? withApplication : candidates,
    );
    const template = pick(approved);
    const sender = pick(users);
    const failure = rand() < 0.2 ? pick(FAILURES) : null;
    const createdAt = new Date(NOW - int(1, 60) * DAY - int(0, 600) * 60_000);
    const { variables, body } = renderTemplate(template, {
      'candidate.firstName': candidate.firstName,
      'job.title': candidate.jobTitle ?? 'the role',
      'recruiter.name': `${sender.firstName} ${sender.lastName}`,
      'recruiter.firstName': sender.firstName,
      'company.name': organization?.name ?? 'RabbitHR',
      'company.phone': organization?.phone ?? ORG_PHONE,
    });
    const message = await messageRepo.save(
      messageRepo.create({
        organizationId,
        provider: PROVIDER,
        templateId: template.id,
        templateName: template.name,
        candidateId: candidate.id,
        applicationId: candidate.applicationId,
        phone: e164(candidate.phone),
        variables,
        renderedBody: body,
        status: failure
          ? WhatsappMessageStatus.FAILED
          : WhatsappMessageStatus.SENT,
        errorCategory: failure?.category ?? null,
        errorMessage: failure?.message ?? null,
        providerMessageId: failure
          ? null
          : `seed-${randomBytes(8).toString('hex')}`,
        dedupeKey: `manual:${template.id}:${candidate.id}:${candidate.applicationId ?? ''}`,
        sentBy: sender.id,
        sentAt: failure ? null : new Date(createdAt.getTime() + 4000),
        createdAt,
      } as DeepPartial<WhatsappMessageEntity>),
    );
    await activityRepo.save(
      activityRepo.create({
        organizationId,
        candidateId: candidate.id,
        applicationId: candidate.applicationId,
        jobId: candidate.jobId,
        clientId: candidate.clientId,
        type: ActivityType.WHATSAPP,
        title: failure
          ? `WhatsApp failed: ${template.name}`
          : `WhatsApp sent: ${template.name}`,
        body,
        metadata: {
          kind: 'whatsapp',
          whatsappMessageId: message.id,
          template: template.name,
          status: message.status,
          phone: message.phone,
          errorCategory: message.errorCategory,
          errorMessage: message.errorMessage,
        },
        actorId: sender.id,
        createdAt: new Date(createdAt.getTime() + 5000),
      } as DeepPartial<ActivityEntity>),
    );
  }
  console.log(`Seeded ${MESSAGE_TARGET - existing} WhatsApp messages`);
}

async function seedJobFeed(
  dataSource: DataSource,
  organizationId: string,
): Promise<void> {
  const repo = dataSource.getRepository(JobFeedEntity);
  if (await repo.exists({ where: { organizationId } })) return;
  await repo.save(
    repo.create({
      organizationId,
      enabled: false,
      includeClientNames: true,
      token: randomBytes(24).toString('hex'),
    }),
  );
  console.log('Created job feed settings (disabled)');
}

async function seedOfferSigning(
  dataSource: DataSource,
  organizationId: string,
): Promise<void> {
  const repo = dataSource.getRepository(OfferEntity);
  const withToken = await repo.count({
    where: { organizationId, signTokenExpiresAt: Not(IsNull()) },
  });
  if (withToken > 0) return;

  const [pending] = await repo.find({
    where: { organizationId, status: OfferStatus.SENT },
    order: { sentAt: 'DESC' },
    take: 1,
  });
  const [signed] = await repo.find({
    where: { organizationId, status: In([OfferStatus.ACCEPTED]) },
    relations: { candidate: true },
    order: { respondedAt: 'DESC' },
    take: 1,
  });

  for (const offer of [pending, signed].filter(Boolean)) {
    const sentAt = offer.sentAt ?? new Date(NOW - 5 * DAY);
    const letter =
      offer.body ??
      `Dear ${offer.candidate?.firstName ?? 'candidate'},\n\nWe are delighted to offer you the ${offer.title} role.\n\nKind regards`;
    const isSigned = offer === signed;
    const signedAt = offer.respondedAt ?? new Date(sentAt.getTime() + 2 * DAY);
    await repo.update(offer.id, {
      signToken: randomBytes(32).toString('hex'),
      signTokenExpiresAt: new Date(
        Math.max(sentAt.getTime() + 30 * DAY, NOW + 14 * DAY),
      ),
      sentLetterBody: letter,
      ...(isSigned && {
        signedAt,
        respondedAt: signedAt,
        signedName: `${offer.candidate.firstName} ${offer.candidate.lastName}`,
        signedIp: '203.0.113.24',
        signedUserAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        signatureHash: createHash('sha256')
          .update(letter, 'utf8')
          .digest('hex'),
      }),
    });
  }
  console.log('Seeded offer signing links');
}

export async function seedAtsPhase3b(
  dataSource: DataSource,
  context: SeedAtsContext,
): Promise<void> {
  const { organizationId } = context;
  await seedIntegrations(dataSource);
  const users: Array<{ id: string; firstName: string; lastName: string }> =
    await dataSource.query(
      `SELECT id, "firstName", "lastName" FROM users WHERE "organizationId" = $1 AND status = $2 ORDER BY email`,
      [organizationId, UserStatus.ACTIVE],
    );
  const candidates = await loadCandidates(dataSource, organizationId);
  await seedCalls(
    dataSource,
    organizationId,
    candidates,
    users.map((u) => u.id),
  );
  const templates = await seedTemplates(dataSource, organizationId);
  await seedMessages(dataSource, organizationId, candidates, templates, users);
  await seedJobFeed(dataSource, organizationId);
  await seedOfferSigning(dataSource, organizationId);
}
