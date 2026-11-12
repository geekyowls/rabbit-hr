import { NotFoundException } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { JobRepository, OrganizationRepository } from '@db/repositories';
import { OrganizationEntity } from '@db/entities';
import { JobStatus, OrganizationStatus } from '@db/enums';

export const CAREERS_JOB_SELECT = [
  'job.id',
  'job.reference',
  'job.title',
  'job.employmentType',
  'job.workMode',
  'job.location',
  'job.salaryMin',
  'job.salaryMax',
  'job.payRate',
  'job.rateUnit',
  'job.currency',
  'job.closingDate',
  'job.publishedAt',
  'job.skills',
];

export const CAREERS_JOB_DETAIL_SELECT = [
  ...CAREERS_JOB_SELECT,
  'job.description',
  'job.requirements',
  'job.screeningQuestions',
  'job.requiredDocuments',
  'job.ownerId',
  'job.clientId',
];

export async function findCareersOrganization(
  organizationRepository: OrganizationRepository,
  slug: string,
): Promise<OrganizationEntity> {
  const organization = await organizationRepository.findOne({
    where: { slug: slug.toLowerCase(), status: OrganizationStatus.ACTIVE },
    select: ['id', 'name', 'slug', 'logo', 'website', 'atsSettings'],
  });
  if (!organization) {
    throw new NotFoundException('Careers page not found');
  }
  return organization;
}

export function buildOpenJobsQuery(
  jobRepository: JobRepository,
  organizationId: string,
  select: string[],
) {
  return jobRepository
    .createQueryBuilder('job')
    .select(select)
    .where('job.organizationId = :organizationId', { organizationId })
    .andWhere('job.status = :status', { status: JobStatus.PUBLISHED })
    .andWhere(
      new Brackets((qb) => {
        qb.where('job.closingDate IS NULL').orWhere(
          'job.closingDate >= CURRENT_DATE',
        );
      }),
    );
}
