'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Briefcase } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  portalKeys,
  useCareersJobQuery,
  useCareersJobsQuery,
  usePortalApplicationsQuery,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, SearchInput, StatusPill } from '@/components/patterns';
import { CareersMeta } from '@/components/careers/careers-job-card';
import { CareersApplyForm } from '@/components/careers/careers-apply-form';
import { DOCUMENT_TYPE_LABEL } from '@/components/applications/application-meta';
import { usePortalSession } from '@/components/portal/portal-session';
import { applicationHref } from '@/components/portal/portal-utils';
import type { DocumentType } from '@/types/document.type';

const PAGE_SIZE = 10;

function jobHref(id: string) {
  return `/portal/jobs?id=${encodeURIComponent(id)}`;
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  if (!text?.trim()) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
        {text}
      </div>
    </section>
  );
}

function JobDetail({ id }: { id: string }) {
  const { me } = usePortalSession();
  const queryClient = useQueryClient();
  const orgSlug = me.organization.slug;
  const { data: job, isLoading, error } = useCareersJobQuery(orgSlug, id);
  const { data: applications = [] } = usePortalApplicationsQuery();
  const existing = applications.find((a) => a.jobId === id);

  const back = (
    <Link
      href="/portal/jobs"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      All roles
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {back}
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (error || !job) {
    return (
      <div className="space-y-4">
        {back}
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            title="This role is no longer open"
            description="It may have been filled or closed. Take a look at the other roles"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {back}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <article className="space-y-5 rounded-xl border border-border bg-card p-4">
          <header className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {job.reference}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              {job.title}
            </h1>
            <CareersMeta job={job} />
          </header>
          <TextBlock title="About the role" text={job.description} />
          <TextBlock title="Requirements" text={job.requirements} />
          {job.requiredDocuments.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Documents you will need</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {job.requiredDocuments.map((doc) => (
                  <li key={doc}>
                    {DOCUMENT_TYPE_LABEL[doc as DocumentType] ?? doc}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
        <div className="lg:sticky lg:top-32">
          {existing ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium">
                You have already applied for this role
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={applicationHref(existing.id)}>
                  View application
                </Link>
              </Button>
            </div>
          ) : (
            <CareersApplyForm
              orgSlug={orgSlug}
              organizationName={me.organization.name}
              job={job}
              lockEmail
              prefill={{
                firstName: me.candidate.firstName,
                lastName: me.candidate.lastName,
                email: me.candidate.email,
                phone: me.candidate.phone,
                location: me.candidate.location,
                linkedinUrl: me.candidate.linkedinUrl,
                customFields: me.candidate.customFields,
              }}
              onApplied={() =>
                queryClient.invalidateQueries({ queryKey: portalKeys.all })
              }
              successAction={
                <Button asChild variant="outline" className="mt-6">
                  <Link href="/portal/applications">See my applications</Link>
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function JobsList() {
  const { me } = usePortalSession();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 500);
  const { data, isLoading } = useCareersJobsQuery(me.organization.slug, {
    page,
    limit: PAGE_SIZE,
    search: debounced.trim() || undefined,
  });
  const { data: applications = [] } = usePortalApplicationsQuery();
  const applied = new Set(applications.map((a) => a.jobId));
  const jobs = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Open roles</h1>
        <p className="text-sm text-muted-foreground">
          Apply with the details you already shared
        </p>
      </div>
      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by title or skill"
        className="w-full sm:w-72"
      />
      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Briefcase className="h-8 w-8" />}
            title={
              debounced
                ? 'No roles match your search'
                : 'No open roles right now'
            }
            description="Check back soon for new opportunities"
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={jobHref(job.id)}
                className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{job.title}</p>
                    {applied.has(job.id) && (
                      <StatusPill tone="success">Applied</StatusPill>
                    )}
                  </div>
                  <CareersMeta job={job} />
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function JobsContent() {
  const id = useSearchParams().get('id');
  return id ? <JobDetail id={id} /> : <JobsList />;
}

export default function PortalJobsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
      <JobsContent />
    </Suspense>
  );
}
