import * as bcrypt from 'bcrypt';
import { DataSource, DeepPartial, In, IsNull } from 'typeorm';
import {
  ApplicationEntity,
  CandidateEntity,
  CustomFieldDefinitionEntity,
  CustomFieldValues,
  JobEntity,
  OrganizationAtsSettings,
  OrganizationEntity,
  PipelineStageEntity,
  UserEntity,
} from '../src/database/entities';
import {
  AtsDateFormat,
  CustomFieldEntityType,
  CustomFieldType,
  DefaultPipelineStage,
  PipelineStageCategory,
  SalaryPeriod,
  UserStatus,
} from '../src/database/enums';
import { createDefaultPipelineStages } from '../src/modules/shared/services/pipeline-stage.service';
import { RECRUITERS, SeedAtsContext } from './seed-ats';

const DEPARTMENT_BY_INDUSTRY: Record<string, string> = {
  'Social care': 'Healthcare',
  'NHS supply chain': 'Healthcare',
  'Logistics and warehousing': 'Industrial',
  Construction: 'Construction & Property',
  Hospitality: 'Hospitality & Retail',
  Retail: 'Hospitality & Retail',
  'Financial services': 'Finance',
  Technology: 'Technology',
};

const DEPARTMENTS = [...new Set(Object.values(DEPARTMENT_BY_INDUSTRY))];

const SEEDED_ORG_SETTINGS: Omit<
  OrganizationAtsSettings,
  'portalEnabled' | 'portalWelcomeMessage' | 'brandColor'
> = {
  defaultCurrency: 'GBP',
  country: 'GB',
  timezone: 'Europe/London',
  dateFormat: AtsDateFormat.DMY,
  locale: 'en-GB',
  weekStartsOn: 1,
  salaryPeriodDefault: SalaryPeriod.YEAR,
  departments: DEPARTMENTS,
};

const HIRING_MANAGERS = [
  {
    firstName: 'Olivia',
    lastName: 'Bennett',
    email: 'olivia.bennett@rabbithr.test',
  },
  {
    firstName: 'Daniel',
    lastName: 'Reyes',
    email: 'daniel.reyes@rabbithr.test',
  },
];

const CUSTOM_STAGES: Array<DefaultPipelineStage & { after: string }> = [
  {
    key: 'phone_screen',
    name: 'Phone screen',
    category: PipelineStageCategory.SCREENING,
    color: 'sky',
    after: 'screening',
  },
  {
    key: 'client_interview',
    name: 'Client interview',
    category: PipelineStageCategory.INTERVIEW,
    color: 'indigo',
    after: 'interview',
  },
];

const STAGE_MOVES: Array<{ from: string; to: string; count: number }> = [
  { from: 'screening', to: 'phone_screen', count: 8 },
  { from: 'interview', to: 'client_interview', count: 7 },
];

const WORK_MODE_OPTIONS = ['On site', 'Hybrid', 'Remote'];
const LANGUAGE_OPTIONS = [
  'English',
  'Welsh',
  'Polish',
  'Romanian',
  'Spanish',
  'Hindi',
  'Punjabi',
  'Urdu',
];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const CUSTOM_FIELDS: Array<DeepPartial<CustomFieldDefinitionEntity>> = [
  {
    entity: CustomFieldEntityType.CANDIDATE,
    key: 'preferred_work_mode',
    label: 'Preferred work mode',
    type: CustomFieldType.SELECT,
    options: WORK_MODE_OPTIONS,
    showOnCareersForm: true,
  },
  {
    entity: CustomFieldEntityType.CANDIDATE,
    key: 'willing_to_relocate',
    label: 'Willing to relocate',
    type: CustomFieldType.BOOLEAN,
    showOnCareersForm: true,
  },
  {
    entity: CustomFieldEntityType.CANDIDATE,
    key: 'portfolio',
    label: 'Portfolio',
    type: CustomFieldType.URL,
    showOnCareersForm: true,
  },
  {
    entity: CustomFieldEntityType.CANDIDATE,
    key: 'languages',
    label: 'Languages',
    type: CustomFieldType.MULTISELECT,
    options: LANGUAGE_OPTIONS,
  },
  {
    entity: CustomFieldEntityType.JOB,
    key: 'cost_centre',
    label: 'Cost centre',
    type: CustomFieldType.TEXT,
  },
  {
    entity: CustomFieldEntityType.JOB,
    key: 'priority',
    label: 'Priority',
    type: CustomFieldType.SELECT,
    options: PRIORITY_OPTIONS,
  },
  {
    entity: CustomFieldEntityType.JOB,
    key: 'visa_sponsorship',
    label: 'Visa sponsorship',
    type: CustomFieldType.BOOLEAN,
  },
];

async function seedDefaultStagesForAllOrganizations(
  dataSource: DataSource,
): Promise<void> {
  const organizations = await dataSource
    .getRepository(OrganizationEntity)
    .find({ select: ['id', 'name'] });
  for (const organization of organizations) {
    const created = await createDefaultPipelineStages(
      dataSource.manager,
      organization.id,
    );
    if (created.length > 0) {
      console.log(`Created default pipeline stages for ${organization.name}`);
    }
  }
}

async function seedSettings(
  dataSource: DataSource,
  organizationId: string,
): Promise<void> {
  const repo = dataSource.getRepository(OrganizationEntity);
  const organization = await repo.findOne({
    where: { id: organizationId },
    select: ['id', 'atsSettings'],
  });
  if (!organization) return;
  const stored = organization.atsSettings;
  if (stored && stored.departments?.length) return;
  await repo.update(
    { id: organizationId },
    {
      atsSettings: {
        ...SEEDED_ORG_SETTINGS,
        ...(stored ?? {}),
        departments: DEPARTMENTS,
      },
    },
  );
  console.log('Seeded ATS settings (GBP, en-GB, Europe/London)');
}

async function seedHiringManagers(
  dataSource: DataSource,
  context: SeedAtsContext,
): Promise<string[]> {
  const repo = dataSource.getRepository(UserEntity);
  const password = await bcrypt.hash('Admin@123', 10);
  const ids: string[] = [];
  for (const manager of HIRING_MANAGERS) {
    const existing = await repo.findOne({
      where: { email: manager.email, organizationId: context.organizationId },
      select: ['id'],
    });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const created = await repo.save(
      repo.create({
        ...manager,
        password,
        organizationId: context.organizationId,
        roleId: context.adminRoleId,
        status: UserStatus.ACTIVE,
        isActive: true,
        phoneCountryCode: 'GB',
      }),
    );
    ids.push(created.id);
    console.log(`Created hiring manager: ${manager.email} / Admin@123`);
  }
  return ids;
}

async function seedStages(
  dataSource: DataSource,
  organizationId: string,
): Promise<void> {
  const repo = dataSource.getRepository(PipelineStageEntity);
  await createDefaultPipelineStages(dataSource.manager, organizationId);
  const existing = await repo.find({
    where: { organizationId },
    order: { order: 'ASC' },
  });
  const keys = new Set(existing.map((s) => s.key));
  const missing = CUSTOM_STAGES.filter((s) => !keys.has(s.key));
  if (missing.length === 0) return;

  const ordered: string[] = existing.map((s) => s.key);
  for (const stage of missing) {
    const anchor = ordered.indexOf(stage.after);
    ordered.splice(anchor === -1 ? ordered.length : anchor + 1, 0, stage.key);
  }
  await repo.save(
    missing.map(({ after: _after, ...stage }) =>
      repo.create({
        ...stage,
        organizationId,
        order: ordered.indexOf(stage.key),
        isSystem: false,
        isActive: true,
      }),
    ),
  );
  for (const stage of existing) {
    await repo.update({ id: stage.id }, { order: ordered.indexOf(stage.key) });
  }
  console.log(
    `Added custom pipeline stages: ${missing.map((s) => s.key).join(', ')}`,
  );
}

async function seedStageMoves(
  dataSource: DataSource,
  organizationId: string,
): Promise<void> {
  const repo = dataSource.getRepository(ApplicationEntity);
  for (const move of STAGE_MOVES) {
    const already = await repo.count({
      where: { organizationId, stage: move.to },
    });
    if (already > 0) continue;
    const candidates = await repo.find({
      where: { organizationId, stage: move.from },
      order: { stageChangedAt: 'DESC' },
      take: move.count,
      select: ['id'],
    });
    if (candidates.length === 0) continue;
    await repo.update(
      { id: In(candidates.map((a) => a.id)) },
      { stage: move.to },
    );
    console.log(
      `Moved ${candidates.length} applications from ${move.from} to ${move.to}`,
    );
  }
}

async function seedJobTeams(
  dataSource: DataSource,
  context: SeedAtsContext,
  hiringManagerIds: string[],
): Promise<void> {
  const recruiters = await dataSource.getRepository(UserEntity).find({
    where: {
      organizationId: context.organizationId,
      email: In(RECRUITERS.map((r) => r.email)),
    },
    select: ['id'],
  });
  const recruiterIds = recruiters.map((r) => r.id);
  if (recruiterIds.length === 0 || hiringManagerIds.length === 0) return;

  const jobs: Array<{ id: string; industry: string | null }> =
    await dataSource.query(
      `SELECT j.id, c.industry
       FROM jobs j
       LEFT JOIN clients c ON c.id = j."clientId"
       WHERE j."organizationId" = $1 AND j.department IS NULL
       ORDER BY j.reference`,
      [context.organizationId],
    );
  const repo = dataSource.getRepository(JobEntity);
  for (const [index, job] of jobs.entries()) {
    const hiringManagerId = hiringManagerIds[index % hiringManagerIds.length];
    const recruiterId = recruiterIds[index % recruiterIds.length];
    const secondRecruiter = recruiterIds[(index + 1) % recruiterIds.length];
    await repo.update(
      { id: job.id },
      {
        department:
          (job.industry && DEPARTMENT_BY_INDUSTRY[job.industry]) ??
          DEPARTMENTS[index % DEPARTMENTS.length],
        hiringManagerId,
        recruiterId,
        hiringTeamIds: [
          ...new Set([hiringManagerId, recruiterId, secondRecruiter]),
        ],
      },
    );
  }
  if (jobs.length > 0) {
    console.log(`Assigned departments and hiring teams to ${jobs.length} jobs`);
  }
}

async function seedCustomFields(
  dataSource: DataSource,
  organizationId: string,
): Promise<void> {
  const repo = dataSource.getRepository(CustomFieldDefinitionEntity);
  const existing = await repo.find({ where: { organizationId } });
  const taken = new Set(existing.map((d) => `${d.entity}:${d.key}`));
  const missing = CUSTOM_FIELDS.filter(
    (d) => !taken.has(`${d.entity}:${d.key}`),
  );
  if (missing.length === 0) return;
  await repo.save(
    missing.map((definition) =>
      repo.create({
        ...definition,
        organizationId,
        order: CUSTOM_FIELDS.filter(
          (d) => d.entity === definition.entity,
        ).indexOf(definition),
        required: false,
        isActive: true,
      }),
    ),
  );
  console.log(`Created ${missing.length} custom field definitions`);
}

function candidateValues(index: number, slug: string): CustomFieldValues {
  const values: CustomFieldValues = {
    preferred_work_mode: WORK_MODE_OPTIONS[index % WORK_MODE_OPTIONS.length],
    willing_to_relocate: index % 3 === 0,
    languages: [
      'English',
      ...(index % 2 === 0
        ? [LANGUAGE_OPTIONS[1 + (index % (LANGUAGE_OPTIONS.length - 1))]]
        : []),
    ],
  };
  if (index % 4 === 0) {
    values.portfolio = `https://portfolio.example.com/${slug}`;
  }
  return values;
}

function jobValues(index: number): CustomFieldValues {
  return {
    cost_centre: `CC-${String(100 + (index % 12)).padStart(3, '0')}`,
    priority: PRIORITY_OPTIONS[index % PRIORITY_OPTIONS.length],
    visa_sponsorship: index % 5 === 0,
  };
}

async function seedCustomFieldValues(
  dataSource: DataSource,
  organizationId: string,
): Promise<void> {
  const candidateRepo = dataSource.getRepository(CandidateEntity);
  const jobRepo = dataSource.getRepository(JobEntity);

  const candidates: Array<{ id: string; firstName: string; lastName: string }> =
    await dataSource.query(
      `SELECT id, "firstName", "lastName" FROM candidates
       WHERE "organizationId" = $1 AND "customFields" = '{}'::jsonb
       ORDER BY "createdAt", id`,
      [organizationId],
    );
  for (const [index, candidate] of candidates.entries()) {
    const slug = `${candidate.firstName}-${candidate.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    await candidateRepo.update(
      { id: candidate.id },
      { customFields: candidateValues(index, slug) },
    );
  }

  const jobs: Array<{ id: string }> = await dataSource.query(
    `SELECT id FROM jobs
     WHERE "organizationId" = $1 AND "customFields" = '{}'::jsonb
     ORDER BY reference`,
    [organizationId],
  );
  for (const [index, job] of jobs.entries()) {
    await jobRepo.update({ id: job.id }, { customFields: jobValues(index) });
  }

  if (candidates.length + jobs.length > 0) {
    console.log(
      `Filled custom field values on ${candidates.length} candidates and ${jobs.length} jobs`,
    );
  }
}

export async function seedAtsPhase2(
  dataSource: DataSource,
  context: SeedAtsContext,
): Promise<void> {
  const { organizationId } = context;
  await seedSettings(dataSource, organizationId);
  await seedStages(dataSource, organizationId);
  await seedDefaultStagesForAllOrganizations(dataSource);
  await seedStageMoves(dataSource, organizationId);
  const hiringManagerIds = await seedHiringManagers(dataSource, context);
  await seedJobTeams(dataSource, context, hiringManagerIds);
  await seedCustomFields(dataSource, organizationId);
  await seedCustomFieldValues(dataSource, organizationId);

  const invalid: Array<{ count: string }> = await dataSource.query(
    `SELECT COUNT(*) AS count FROM applications a
     LEFT JOIN pipeline_stages ps ON ps."organizationId" = a."organizationId" AND ps.key = a.stage
     WHERE ps.id IS NULL`,
  );
  const unassigned = await dataSource
    .getRepository(JobEntity)
    .count({ where: { organizationId, department: IsNull() } });
  console.log(
    `ATS phase 2 seed complete: ${invalid[0]?.count ?? 0} applications without a valid stage, ${unassigned} jobs without a department`,
  );
}
