import { Injectable } from '@nestjs/common';
import {
  ApplicationRepository,
  CandidateRepository,
  OrganizationRepository,
  PipelineStageRepository,
  UserRepository,
} from '@db/repositories';
import { toE164 } from '@shared/helpers/integration-credentials';

export interface PlaceholderContext {
  organizationId: string;
  candidateId: string;
  applicationId?: string | null;
  senderId?: string | null;
}

type Need = 'application';

export interface PlaceholderDefinition {
  key: string;
  label: string;
  group: string;
  needs: Need[];
}

const define = (
  group: string,
  prefix: string,
  fields: Array<[string, string]>,
  needs: Need[] = [],
): PlaceholderDefinition[] =>
  fields.map(([field, label]) => ({
    key: `${prefix}.${field}`,
    label,
    group,
    needs,
  }));

export const PLACEHOLDERS: PlaceholderDefinition[] = [
  ...define('Candidate', 'candidate', [
    ['firstName', 'Candidate first name'],
    ['lastName', 'Candidate last name'],
    ['fullName', 'Candidate full name'],
    ['email', 'Candidate email'],
    ['phone', 'Candidate phone'],
  ]),
  ...define(
    'Job',
    'job',
    [
      ['title', 'Job title'],
      ['reference', 'Job reference'],
      ['location', 'Job location'],
    ],
    ['application'],
  ),
  ...define(
    'Application',
    'application',
    [['stage', 'Application stage']],
    ['application'],
  ),
  ...define('Client', 'client', [['name', 'Client name']], ['application']),
  ...define('Recruiter', 'recruiter', [
    ['name', 'Recruiter name'],
    ['firstName', 'Recruiter first name'],
    ['email', 'Recruiter email'],
    ['phone', 'Recruiter phone'],
  ]),
  ...define('Company', 'company', [
    ['name', 'Company name'],
    ['phone', 'Company phone'],
    ['email', 'Company email'],
    ['website', 'Company website'],
  ]),
];

const PLACEHOLDER_KEYS = new Set(PLACEHOLDERS.map((p) => p.key));

export function isPlaceholderKey(key: string): boolean {
  return PLACEHOLDER_KEYS.has(key);
}

const clean = (value: string | null | undefined): string | null =>
  value && value.trim() ? value.trim() : null;

@Injectable()
export class PlaceholderService {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly pipelineStageRepository: PipelineStageRepository,
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async resolve(
    ctx: PlaceholderContext,
    keys: string[],
  ): Promise<Record<string, string | null>> {
    const groups = new Set(keys.map((k) => k.split('.')[0]));
    const { organizationId } = ctx;
    const [candidate, application, sender, organization] = await Promise.all([
      groups.has('candidate')
        ? this.candidateRepository.findOne({
            where: { id: ctx.candidateId, organizationId },
            select: ['id', 'firstName', 'lastName', 'email', 'phone'],
          })
        : null,
      ctx.applicationId &&
      ['job', 'application', 'client'].some((g) => groups.has(g))
        ? this.applicationRepository.findOne({
            where: { id: ctx.applicationId, organizationId },
            relations: { job: { client: true } },
            select: {
              id: true,
              stage: true,
              job: {
                id: true,
                title: true,
                reference: true,
                location: true,
                client: { id: true, name: true },
              },
            },
          })
        : null,
      groups.has('recruiter') && ctx.senderId
        ? this.userRepository.findOne({
            where: { id: ctx.senderId, organizationId },
            select: ['id', 'firstName', 'lastName', 'email', 'phone'],
          })
        : null,
      groups.has('company')
        ? this.organizationRepository.findOne({
            where: { id: organizationId },
            select: ['id', 'name', 'phone', 'email', 'website'],
          })
        : null,
    ]);

    const stage =
      application && groups.has('application')
        ? await this.pipelineStageRepository.findOne({
            where: { organizationId, key: application.stage },
            select: ['id', 'name'],
          })
        : null;

    const recruiterName = sender
      ? [sender.firstName, sender.lastName].filter(Boolean).join(' ')
      : null;

    const values: Record<string, string | null | undefined> = {
      'candidate.firstName': candidate?.firstName,
      'candidate.lastName': candidate?.lastName,
      'candidate.fullName': candidate
        ? `${candidate.firstName} ${candidate.lastName}`
        : null,
      'candidate.email': candidate?.email,
      'candidate.phone': toE164(candidate?.phone),
      'job.title': application?.job?.title,
      'job.reference': application?.job?.reference,
      'job.location': application?.job?.location,
      'application.stage': stage?.name ?? application?.stage,
      'client.name': application?.job?.client?.name,
      'recruiter.name': recruiterName || sender?.email,
      'recruiter.firstName': sender?.firstName,
      'recruiter.email': sender?.email,
      'recruiter.phone': sender?.phone,
      'company.name': organization?.name,
      'company.phone': organization?.phone,
      'company.email': organization?.email,
      'company.website': organization?.website,
    };
    return Object.fromEntries(keys.map((k) => [k, clean(values[k])]));
  }
}
