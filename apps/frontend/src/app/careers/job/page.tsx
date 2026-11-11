'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import {
  useCareersJobQuery,
  useCareersOrganizationQuery,
} from '@/hooks/queries';
import { ApiError } from '@/utils/error-class';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CareersNotFound,
  CareersShell,
} from '@/components/careers/careers-shell';
import { CareersMeta } from '@/components/careers/careers-job-card';
import { CareersApplyForm } from '@/components/careers/careers-apply-form';
import {
  careersListHref,
  formatClosingDate,
  postedLabel,
} from '@/components/careers/careers-utils';

function JobDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-xl" />
    </div>
  );
}

function TextSection({ title, text }: { title: string; text: string | null }) {
  if (!text?.trim()) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
        {text}
      </div>
    </section>
  );
}

function isNotFound(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.statusCode === 404 || error.statusCode === 400)
  );
}

function CareersJobContent() {
  const params = useSearchParams();
  const orgSlug = params.get('org')?.trim() || null;
  const jobId = params.get('id')?.trim() || null;
  const orgQuery = useCareersOrganizationQuery(orgSlug);
  const jobQuery = useCareersJobQuery(orgQuery.data ? orgSlug : null, jobId);

  if (!orgSlug || isNotFound(orgQuery.error)) {
    return (
      <CareersShell>
        <CareersNotFound />
      </CareersShell>
    );
  }

  const backLink = (
    <Button asChild variant="outline">
      <Link href={careersListHref(orgSlug)}>See all roles</Link>
    </Button>
  );

  if (orgQuery.error) {
    return (
      <CareersShell>
        <CareersNotFound
          title="We could not load this role"
          description="Please refresh the page or try again in a few minutes"
          action={
            <Button variant="outline" onClick={() => orgQuery.refetch()}>
              Try again
            </Button>
          }
        />
      </CareersShell>
    );
  }

  if (!jobId || isNotFound(jobQuery.error)) {
    return (
      <CareersShell organization={orgQuery.data} loading={orgQuery.isLoading}>
        <CareersNotFound
          title="This role is no longer open"
          description="It may have been filled or closed. Take a look at our other opportunities."
          action={backLink}
        />
      </CareersShell>
    );
  }

  const job = jobQuery.data;

  return (
    <CareersShell organization={orgQuery.data} loading={orgQuery.isLoading}>
      {jobQuery.error ? (
        <CareersNotFound
          title="We could not load this role"
          description="Please refresh the page or try again in a few minutes"
          action={
            <Button variant="outline" onClick={() => jobQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !job || !orgQuery.data ? (
        <JobDetailSkeleton />
      ) : (
        <div className="space-y-4">
          <Link
            href={careersListHref(orgSlug)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All roles
          </Link>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <article className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6">
              <header className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {job.reference}
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {job.title}
                  </h1>
                </div>
                <CareersMeta job={job} />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {postedLabel(job.publishedAt) && (
                    <span>{postedLabel(job.publishedAt)}</span>
                  )}
                  {formatClosingDate(job.closingDate) && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Closes {formatClosingDate(job.closingDate)}
                    </span>
                  )}
                </div>
              </header>
              <TextSection title="About the role" text={job.description} />
              <TextSection title="Requirements" text={job.requirements} />
              {job.skills.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-base font-semibold">Skills</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              {job.requiredDocuments.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-base font-semibold">
                    Documents you will need
                  </h2>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {job.requiredDocuments.map((doc) => (
                      <li key={doc}>{doc}</li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
            <div className="lg:sticky lg:top-6">
              <CareersApplyForm
                orgSlug={orgSlug}
                organizationName={orgQuery.data.name}
                job={job}
              />
            </div>
          </div>
        </div>
      )}
    </CareersShell>
  );
}

export default function CareersJobPage() {
  return (
    <Suspense
      fallback={
        <CareersShell loading>
          <JobDetailSkeleton />
        </CareersShell>
      }
    >
      <CareersJobContent />
    </Suspense>
  );
}
