import { NotFoundException } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import {
  ApplicationRepository,
  CandidateDocumentRepository,
  CandidateRepository,
  InterviewBookingLinkRepository,
  InterviewRepository,
  OfferRepository,
  OrganizationRepository,
} from '@db/repositories';
import {
  InterviewEntity,
  OfferEntity,
  OrganizationEntity,
  resolveAtsSettings,
} from '@db/entities';
import {
  CLOSED_PIPELINE_STAGE_CATEGORIES,
  DocumentType,
  DocumentVerificationStatus,
  InterviewBookingLinkStatus,
  InterviewStatus,
  OfferStatus,
  OrganizationStatus,
  PipelineStageCategory,
} from '@db/enums';
import { offerSignStatus } from '@modules/offer/usecases/offer-signing';
import { PipelineStageService } from '@shared/services/pipeline-stage.service';

export const PORTAL_STAGE_LABELS: Record<PipelineStageCategory, string> = {
  [PipelineStageCategory.APPLIED]: 'Application received',
  [PipelineStageCategory.SCREENING]: 'In review',
  [PipelineStageCategory.INTERVIEW]: 'Interviewing',
  [PipelineStageCategory.OFFER]: 'Offer',
  [PipelineStageCategory.HIRED]: 'Hired',
  [PipelineStageCategory.REJECTED]: 'Not progressing',
  [PipelineStageCategory.WITHDRAWN]: 'Withdrawn',
};

export const PORTAL_PROGRESS_STEPS: PipelineStageCategory[] = [
  PipelineStageCategory.APPLIED,
  PipelineStageCategory.SCREENING,
  PipelineStageCategory.INTERVIEW,
  PipelineStageCategory.OFFER,
  PipelineStageCategory.HIRED,
];

export interface PortalBranding {
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  brandColor: string | null;
  welcomeMessage: string;
  portalEnabled: boolean;
}

export const PORTAL_ORGANIZATION_SELECT: (keyof OrganizationEntity)[] = [
  'id',
  'name',
  'slug',
  'logo',
  'website',
  'status',
  'atsSettings',
];

export function toPortalBranding(
  organization: Pick<
    OrganizationEntity,
    'name' | 'slug' | 'logo' | 'website' | 'atsSettings'
  >,
): PortalBranding {
  const settings = resolveAtsSettings(organization.atsSettings);
  return {
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo,
    website: organization.website,
    brandColor: settings.brandColor,
    welcomeMessage: settings.portalWelcomeMessage,
    portalEnabled: settings.portalEnabled,
  };
}

export async function findPortalOrganizationBySlug(
  organizationRepository: OrganizationRepository,
  slug: string,
  options: { requireEnabled?: boolean } = {},
): Promise<OrganizationEntity> {
  const organization = await organizationRepository.findOne({
    where: { slug: slug.toLowerCase(), status: OrganizationStatus.ACTIVE },
    select: PORTAL_ORGANIZATION_SELECT,
  });
  if (!organization) {
    throw new NotFoundException('Candidate portal not found');
  }
  if (
    options.requireEnabled !== false &&
    !resolveAtsSettings(organization.atsSettings).portalEnabled
  ) {
    throw new NotFoundException('Candidate portal is not available');
  }
  return organization;
}

export async function loadPortalOrganization(
  organizationRepository: OrganizationRepository,
  organizationId: string,
): Promise<OrganizationEntity> {
  const organization = await organizationRepository.findOne({
    where: { id: organizationId },
    select: PORTAL_ORGANIZATION_SELECT,
  });
  if (!organization) {
    throw new NotFoundException('Organization not found');
  }
  return organization;
}

export async function loadPortalCandidate(
  candidateRepository: CandidateRepository,
  candidateId: string,
  organizationId: string,
) {
  const candidate = await candidateRepository.findOne({
    where: { id: candidateId, organizationId },
  });
  if (!candidate) {
    throw new NotFoundException('Candidate not found');
  }
  return candidate;
}

export async function stageCategories(
  pipelineStageService: PipelineStageService,
  organizationId: string,
): Promise<Map<string, PipelineStageCategory>> {
  const stages = await pipelineStageService.getStages(organizationId);
  return new Map(stages.map((s) => [s.key, s.category]));
}

export function isClosedCategory(category: PipelineStageCategory): boolean {
  return CLOSED_PIPELINE_STAGE_CATEGORIES.includes(category);
}

export interface PortalApplicationRow {
  id: string;
  jobId: string;
  clientId: string | null;
  jobTitle: string;
  jobReference: string;
  jobLocation: string | null;
  employmentType: string;
  workMode: string;
  stage: string;
  appliedAt: Date;
  stageChangedAt: Date;
  requiredDocuments: string[];
}

export function toPortalStatus(
  categories: Map<string, PipelineStageCategory>,
  stageKey: string,
) {
  const category = categories.get(stageKey) ?? PipelineStageCategory.APPLIED;
  return {
    category,
    label: PORTAL_STAGE_LABELS[category],
    isClosed: isClosedCategory(category),
  };
}

export async function listPortalApplicationRows(
  applicationRepository: ApplicationRepository,
  candidateId: string,
  organizationId: string,
  applicationId?: string,
): Promise<PortalApplicationRow[]> {
  const qb = applicationRepository
    .createQueryBuilder('application')
    .innerJoin('application.job', 'job')
    .select([
      'application.id AS "id"',
      'application.jobId AS "jobId"',
      'job.clientId AS "clientId"',
      'job.title AS "jobTitle"',
      'job.reference AS "jobReference"',
      'job.location AS "jobLocation"',
      'job.employmentType AS "employmentType"',
      'job.workMode AS "workMode"',
      'job.requiredDocuments AS "requiredDocuments"',
      'application.stage AS "stage"',
      'application.appliedAt AS "appliedAt"',
      'application.stageChangedAt AS "stageChangedAt"',
    ])
    .where('application.candidateId = :candidateId', { candidateId })
    .andWhere('application.organizationId = :organizationId', {
      organizationId,
    })
    .orderBy('application.appliedAt', 'DESC');
  if (applicationId) {
    qb.andWhere('application.id = :applicationId', { applicationId });
  }
  return qb.getRawMany<PortalApplicationRow>();
}

export function toPortalApplication(
  row: PortalApplicationRow,
  categories: Map<string, PipelineStageCategory>,
) {
  const status = toPortalStatus(categories, row.stage);
  return {
    id: row.id,
    jobId: row.jobId,
    jobTitle: row.jobTitle,
    jobReference: row.jobReference,
    jobLocation: row.jobLocation,
    employmentType: row.employmentType,
    workMode: row.workMode,
    status: status.category,
    statusLabel: status.label,
    isClosed: status.isClosed,
    appliedAt: row.appliedAt,
    updatedAt: row.stageChangedAt,
  };
}

export function buildPortalDocumentsQuery(
  documentRepository: CandidateDocumentRepository,
  candidateId: string,
  organizationId: string,
) {
  return documentRepository
    .createQueryBuilder('document')
    .select([
      'document.id',
      'document.applicationId',
      'document.type',
      'document.name',
      'document.fileName',
      'document.mimeType',
      'document.sizeBytes',
      'document.verificationStatus',
      'document.expiresAt',
      'document.createdAt',
    ])
    .where('document.candidateId = :candidateId', { candidateId })
    .andWhere('document.organizationId = :organizationId', { organizationId });
}

export interface PortalDocumentRequest {
  type: DocumentType;
  jobTitles: string[];
  applicationIds: string[];
}

export async function listDocumentRequests(
  documentRepository: CandidateDocumentRepository,
  rows: PortalApplicationRow[],
  categories: Map<string, PipelineStageCategory>,
  candidateId: string,
  organizationId: string,
): Promise<PortalDocumentRequest[]> {
  const open = rows.filter(
    (row) => !toPortalStatus(categories, row.stage).isClosed,
  );
  if (open.length === 0) return [];
  const provided = await documentRepository
    .createQueryBuilder('document')
    .select('DISTINCT document.type', 'type')
    .where('document.candidateId = :candidateId', { candidateId })
    .andWhere('document.organizationId = :organizationId', { organizationId })
    .andWhere('document.verificationStatus IN (:...statuses)', {
      statuses: [
        DocumentVerificationStatus.PENDING,
        DocumentVerificationStatus.VERIFIED,
      ],
    })
    .getRawMany<{ type: DocumentType }>();
  const providedTypes = new Set(provided.map((p) => p.type));
  const requests = new Map<DocumentType, PortalDocumentRequest>();
  for (const row of open) {
    for (const raw of row.requiredDocuments ?? []) {
      const type = raw as DocumentType;
      if (!Object.values(DocumentType).includes(type)) continue;
      if (providedTypes.has(type)) continue;
      const request = requests.get(type) ?? {
        type,
        jobTitles: [],
        applicationIds: [],
      };
      if (!request.jobTitles.includes(row.jobTitle)) {
        request.jobTitles.push(row.jobTitle);
      }
      request.applicationIds.push(row.id);
      requests.set(type, request);
    }
  }
  return [...requests.values()];
}

export interface PortalScope {
  candidateId: string;
  organizationId: string;
  applicationId?: string;
}

export function toPortalInterview(
  interview: InterviewEntity & { job?: { title: string } },
) {
  const now = Date.now();
  const endsAt =
    new Date(interview.scheduledAt).getTime() +
    interview.durationMinutes * 60_000;
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    jobTitle: interview.job?.title ?? null,
    title: interview.title,
    type: interview.type,
    scheduledAt: interview.scheduledAt,
    durationMinutes: interview.durationMinutes,
    timezone: interview.timezone,
    location: interview.location,
    meetingUrl: interview.meetingUrl,
    status: interview.status,
    isUpcoming: interview.status === InterviewStatus.SCHEDULED && endsAt >= now,
  };
}

export async function listPortalInterviews(
  interviewRepository: InterviewRepository,
  scope: PortalScope,
) {
  const qb = interviewRepository
    .createQueryBuilder('interview')
    .innerJoin('interview.job', 'job')
    .select([
      'interview.id',
      'interview.applicationId',
      'interview.title',
      'interview.type',
      'interview.scheduledAt',
      'interview.durationMinutes',
      'interview.timezone',
      'interview.location',
      'interview.meetingUrl',
      'interview.status',
      'job.id',
      'job.title',
    ])
    .where('interview.candidateId = :candidateId', {
      candidateId: scope.candidateId,
    })
    .andWhere('interview.organizationId = :organizationId', {
      organizationId: scope.organizationId,
    })
    .orderBy('interview.scheduledAt', 'ASC');
  if (scope.applicationId) {
    qb.andWhere('interview.applicationId = :applicationId', {
      applicationId: scope.applicationId,
    });
  }
  const interviews = await qb.getMany();
  return interviews.map(toPortalInterview);
}

export async function listPortalBookingLinks(
  bookingLinkRepository: InterviewBookingLinkRepository,
  scope: PortalScope,
) {
  const links = await bookingLinkRepository.find({
    where: {
      candidateId: scope.candidateId,
      organizationId: scope.organizationId,
      status: InterviewBookingLinkStatus.OPEN,
      expiresAt: MoreThan(new Date()),
      ...(scope.applicationId && { applicationId: scope.applicationId }),
    },
    relations: { job: true },
    order: { createdAt: 'DESC' },
  });
  return links.map((link) => ({
    id: link.id,
    applicationId: link.applicationId,
    jobTitle: link.job?.title ?? null,
    title: link.title,
    type: link.type,
    durationMinutes: link.durationMinutes,
    expiresAt: link.expiresAt,
    token: link.token,
  }));
}

const CANDIDATE_VISIBLE_OFFER_STATUSES = [
  OfferStatus.SENT,
  OfferStatus.ACCEPTED,
  OfferStatus.DECLINED,
  OfferStatus.EXPIRED,
  OfferStatus.WITHDRAWN,
];

export function toPortalOffer(
  offer: OfferEntity & { job?: { title: string } },
) {
  return {
    id: offer.id,
    applicationId: offer.applicationId,
    jobTitle: offer.job?.title ?? null,
    title: offer.title,
    salaryAmount: offer.salaryAmount,
    currency: offer.currency,
    salaryPeriod: offer.salaryPeriod,
    bonus: offer.bonus,
    startDate: offer.startDate,
    expiresAt: offer.expiresAt,
    employmentType: offer.employmentType,
    location: offer.location,
    sentAt: offer.sentAt,
    respondedAt: offer.respondedAt,
    signedAt: offer.signedAt,
    signStatus: offerSignStatus(offer),
    signToken: offer.signToken,
  };
}

export async function listPortalOffers(
  offerRepository: OfferRepository,
  scope: PortalScope,
) {
  const qb = offerRepository
    .createQueryBuilder('offer')
    .innerJoin('offer.job', 'job')
    .addSelect(['job.id', 'job.title'])
    .addSelect('offer.signToken')
    .where('offer.candidateId = :candidateId', {
      candidateId: scope.candidateId,
    })
    .andWhere('offer.organizationId = :organizationId', {
      organizationId: scope.organizationId,
    })
    .andWhere('offer.sentAt IS NOT NULL')
    .andWhere('offer.status IN (:...statuses)', {
      statuses: CANDIDATE_VISIBLE_OFFER_STATUSES,
    })
    .orderBy('offer.sentAt', 'DESC');
  if (scope.applicationId) {
    qb.andWhere('offer.applicationId = :applicationId', {
      applicationId: scope.applicationId,
    });
  }
  const offers = await qb.getMany();
  return offers.map(toPortalOffer);
}
