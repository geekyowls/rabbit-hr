import { JobEntity } from '@db/entities';
import { EmploymentType, RateUnit, WorkMode } from '@db/enums';
import { escapeHtml } from '@shared/helpers/html-escape';

export interface FeedContext {
  organizationName: string;
  organizationSlug: string;
  country: string;
  locale: string;
  includeClientNames: boolean;
  frontendUrl: string;
}

export type FeedJob = Pick<
  JobEntity,
  | 'id'
  | 'reference'
  | 'title'
  | 'description'
  | 'requirements'
  | 'employmentType'
  | 'workMode'
  | 'location'
  | 'salaryMin'
  | 'salaryMax'
  | 'payRate'
  | 'rateUnit'
  | 'currency'
  | 'closingDate'
  | 'publishedAt'
  | 'createdAt'
> & { client?: { name: string } | null };

const cdata = (value: string | number | null | undefined): string =>
  `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

const tag = (name: string, value: string | number | null | undefined) =>
  `<${name}>${cdata(value)}</${name}>`;

const PERIOD_LABELS: Record<RateUnit, string> = {
  [RateUnit.HOUR]: 'per hour',
  [RateUnit.DAY]: 'per day',
  [RateUnit.YEAR]: 'per year',
};

const LINKEDIN_PERIODS: Record<RateUnit, string> = {
  [RateUnit.HOUR]: 'HOURLY',
  [RateUnit.DAY]: 'DAILY',
  [RateUnit.YEAR]: 'YEARLY',
};

const INDEED_JOB_TYPES: Record<EmploymentType, string> = {
  [EmploymentType.PERMANENT]: 'fulltime',
  [EmploymentType.TEMPORARY]: 'temporary',
  [EmploymentType.CONTRACT]: 'contract',
};

const LINKEDIN_JOB_TYPES: Record<EmploymentType, string> = {
  [EmploymentType.PERMANENT]: 'FULL_TIME',
  [EmploymentType.TEMPORARY]: 'TEMPORARY',
  [EmploymentType.CONTRACT]: 'CONTRACT',
};

const INDEED_REMOTE: Record<WorkMode, string> = {
  [WorkMode.ONSITE]: '',
  [WorkMode.HYBRID]: 'Hybrid remote',
  [WorkMode.REMOTE]: 'Fully remote',
};

const LINKEDIN_WORKPLACE: Record<WorkMode, string> = {
  [WorkMode.ONSITE]: 'On-site',
  [WorkMode.HYBRID]: 'Hybrid',
  [WorkMode.REMOTE]: 'Remote',
};

function paragraphs(text: string | null): string {
  if (!text?.trim()) return '';
  return text
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\r?\n/g, '<br />')}</p>`)
    .join('');
}

function descriptionHtml(job: FeedJob): string {
  const requirements = paragraphs(job.requirements);
  return [
    paragraphs(job.description),
    requirements ? `<h3>Requirements</h3>${requirements}` : '',
  ].join('');
}

function salaryRange(job: FeedJob) {
  if (job.salaryMin !== null || job.salaryMax !== null) {
    return {
      low: job.salaryMin ?? job.salaryMax,
      high: job.salaryMax ?? job.salaryMin,
      unit: job.rateUnit ?? RateUnit.YEAR,
    };
  }
  if (job.payRate !== null) {
    return {
      low: job.payRate,
      high: job.payRate,
      unit: job.rateUnit ?? RateUnit.HOUR,
    };
  }
  return null;
}

function salaryText(job: FeedJob, locale: string): string {
  const range = salaryRange(job);
  if (!range) return '';
  const format = (value: number | null) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: job.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value ?? 0);
  const amount =
    range.low === range.high
      ? format(range.low)
      : `${format(range.low)} - ${format(range.high)}`;
  return `${amount} ${PERIOD_LABELS[range.unit]}`;
}

function city(job: FeedJob): string {
  return job.location?.split(',')[0]?.trim() ?? '';
}

function jobUrl(ctx: FeedContext, job: FeedJob): string {
  const query = new URLSearchParams({ org: ctx.organizationSlug, id: job.id });
  return `${ctx.frontendUrl}/careers/job?${query.toString()}`;
}

function company(ctx: FeedContext, job: FeedJob): string {
  return (ctx.includeClientNames && job.client?.name) || ctx.organizationName;
}

function postedAt(job: FeedJob): Date {
  return job.publishedAt ?? job.createdAt;
}

const header = (ctx: FeedContext) => [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<source>',
  tag('publisher', ctx.organizationName),
  tag(
    'publisherurl',
    `${ctx.frontendUrl}/careers?org=${encodeURIComponent(ctx.organizationSlug)}`,
  ),
  `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
];

export function buildIndeedFeed(ctx: FeedContext, jobs: FeedJob[]): string {
  const items = jobs.map((job) =>
    [
      '<job>',
      tag('title', job.title),
      tag('date', postedAt(job).toUTCString()),
      tag('referencenumber', job.reference),
      tag('requisitionid', job.reference),
      tag('url', jobUrl(ctx, job)),
      tag('company', company(ctx, job)),
      tag('sourcename', ctx.organizationName),
      tag('city', city(job)),
      tag('state', ''),
      tag('country', ctx.country),
      tag('postalcode', ''),
      tag('streetaddress', job.location),
      tag('description', descriptionHtml(job)),
      tag('salary', salaryText(job, ctx.locale)),
      tag('jobtype', INDEED_JOB_TYPES[job.employmentType]),
      tag('remotetype', INDEED_REMOTE[job.workMode]),
      job.closingDate ? tag('expirationdate', job.closingDate) : '',
      '</job>',
    ].join(''),
  );
  return [...header(ctx), ...items, '</source>'].join('\n');
}

export function buildLinkedinFeed(ctx: FeedContext, jobs: FeedJob[]): string {
  const items = jobs.map((job) => {
    const range = salaryRange(job);
    const salaries = range
      ? `<salaries><salary><highEnd><amount>${cdata(range.high)}</amount><currencyCode>${cdata(job.currency)}</currencyCode></highEnd><lowEnd><amount>${cdata(range.low)}</amount><currencyCode>${cdata(job.currency)}</currencyCode></lowEnd><period>${cdata(LINKEDIN_PERIODS[range.unit])}</period><type>${cdata('BASE_SALARY')}</type></salary></salaries>`
      : '';
    return [
      '<job>',
      tag('partnerJobId', job.id),
      tag('company', company(ctx, job)),
      tag('title', job.title),
      tag('description', descriptionHtml(job)),
      tag('applyUrl', jobUrl(ctx, job)),
      tag('location', [city(job), ctx.country].filter(Boolean).join(', ')),
      tag('city', city(job)),
      tag('country', ctx.country),
      tag('workplaceTypes', LINKEDIN_WORKPLACE[job.workMode]),
      tag('jobtype', LINKEDIN_JOB_TYPES[job.employmentType]),
      tag('listDate', postedAt(job).toISOString()),
      job.closingDate ? tag('expirationDate', job.closingDate) : '',
      salaries,
      '</job>',
    ].join('');
  });
  return [...header(ctx), ...items, '</source>'].join('\n');
}
