'use client';

import Link from 'next/link';
import { ArrowRight, Banknote, Briefcase, Laptop, MapPin } from 'lucide-react';
import type { CareersJobListItem } from '@/types/careers.type';
import {
  EMPLOYMENT_TYPE_LABEL,
  WORK_MODE_LABEL,
  careersJobHref,
  careersPay,
  postedLabel,
} from './careers-utils';

export function CareersMeta({ job }: { job: CareersJobListItem }) {
  const pay = careersPay(job);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
      {job.location && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Laptop className="h-3.5 w-3.5" />
        {WORK_MODE_LABEL[job.workMode]}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Briefcase className="h-3.5 w-3.5" />
        {EMPLOYMENT_TYPE_LABEL[job.employmentType]}
      </span>
      {pay && (
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
          {pay}
        </span>
      )}
    </div>
  );
}

export function CareersJobCard({
  orgSlug,
  job,
}: {
  orgSlug: string;
  job: CareersJobListItem;
}) {
  const posted = postedLabel(job.publishedAt);
  return (
    <Link
      href={careersJobHref(orgSlug, job.id)}
      className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-[#3F6650]/50 hover:bg-muted/40 sm:p-5 dark:hover:border-[#8FBFA1]/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h2 className="text-base font-semibold group-hover:text-[#3F6650] dark:group-hover:text-[#8FBFA1]">
            {job.title}
          </h2>
          <CareersMeta job={job} />
          {job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      {posted && <p className="mt-3 text-xs text-muted-foreground">{posted}</p>}
    </Link>
  );
}
