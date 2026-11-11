'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Briefcase, MapPin } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useCareersJobsQuery,
  useCareersOrganizationQuery,
} from '@/hooks/queries';
import { ApiError } from '@/utils/error-class';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EmptyState,
  FilterBar,
  FilterDropdown,
  SearchInput,
} from '@/components/patterns';
import {
  CareersNotFound,
  CareersShell,
} from '@/components/careers/careers-shell';
import { CareersJobCard } from '@/components/careers/careers-job-card';
import { EMPLOYMENT_TYPE_LABEL } from '@/components/careers/careers-utils';
import { EMPLOYMENT_TYPES, type EmploymentType } from '@/types/job.type';

const PAGE_SIZE = 10;

const EMPLOYMENT_OPTIONS = [
  { value: 'all', label: 'All types' },
  ...EMPLOYMENT_TYPES.map((t) => ({
    value: t,
    label: EMPLOYMENT_TYPE_LABEL[t],
  })),
];

function JobListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

function CareersContent() {
  const orgSlug = useSearchParams().get('org')?.trim() || null;
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | 'all'>(
    'all',
  );
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);
  const debouncedLocation = useDebounce(location, 500);

  const orgQuery = useCareersOrganizationQuery(orgSlug);
  const jobsQuery = useCareersJobsQuery(orgQuery.data ? orgSlug : null, {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    location: debouncedLocation.trim() || undefined,
    employmentType: employmentType === 'all' ? undefined : employmentType,
  });

  if (
    !orgSlug ||
    (orgQuery.error instanceof ApiError && orgQuery.error.statusCode === 404)
  ) {
    return (
      <CareersShell>
        <CareersNotFound />
      </CareersShell>
    );
  }

  if (orgQuery.error) {
    return (
      <CareersShell>
        <CareersNotFound
          title="We could not load this careers page"
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

  const jobs = jobsQuery.data?.data ?? [];
  const total = jobsQuery.data?.total ?? 0;
  const totalPages = jobsQuery.data?.totalPages ?? 1;
  const hasFilters =
    !!debouncedSearch || !!debouncedLocation || employmentType !== 'all';

  return (
    <CareersShell organization={orgQuery.data} loading={orgQuery.isLoading}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {orgQuery.data
              ? `Open roles at ${orgQuery.data.name}`
              : 'Open roles'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {jobsQuery.data
              ? `${total} ${total === 1 ? 'role' : 'roles'} available`
              : 'Find your next role'}
          </p>
        </div>

        <FilterBar>
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by title or skill"
            className="w-full sm:w-auto"
          />
          <div className="relative w-full sm:w-auto">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              placeholder="Location"
              className="h-8 w-full rounded-md pl-9 text-[13px] sm:w-[200px]"
            />
          </div>
          <FilterDropdown
            label="Type"
            value={employmentType}
            options={EMPLOYMENT_OPTIONS}
            onChange={(v) => {
              setEmploymentType(v as EmploymentType | 'all');
              setPage(1);
            }}
          />
        </FilterBar>

        {orgQuery.isLoading || (jobsQuery.isLoading && !jobsQuery.data) ? (
          <JobListSkeleton />
        ) : jobsQuery.error ? (
          <CareersNotFound
            title="We could not load the roles"
            description="Please try again in a few minutes"
            action={
              <Button variant="outline" onClick={() => jobsQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={<Briefcase className="h-8 w-8" />}
              title={
                hasFilters
                  ? 'No roles match your search'
                  : 'No open roles right now'
              }
              description={
                hasFilters
                  ? 'Try a different keyword, location or job type'
                  : 'Check back soon for new opportunities'
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <CareersJobCard key={job.id} orgSlug={orgSlug} job={job} />
            ))}
          </div>
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
    </CareersShell>
  );
}

export default function CareersPage() {
  return (
    <Suspense
      fallback={
        <CareersShell loading>
          <JobListSkeleton />
        </CareersShell>
      }
    >
      <CareersContent />
    </Suspense>
  );
}
