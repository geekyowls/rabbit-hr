'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Archive,
  ArchiveRestore,
  Briefcase,
  Building2,
  Contact,
  Pencil,
  Star,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  SectionCard,
  StatTile,
  StatTileRow,
  StatusPill,
  RowActions,
  EmptyState,
  ToolbarButton,
  type RowAction,
} from '@/components/patterns';
import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { ClientFormDrawer } from '@/components/clients/client-form-drawer';
import { ClientContactDialog } from '@/components/clients/client-contact-dialog';
import {
  CLIENT_STATUS_LABEL,
  CLIENT_STATUS_TONE,
  ClientLogo,
  formatAddress,
} from '@/components/clients/client-utils';
import { JobFormDrawer } from '@/components/jobs/job-form-drawer';
import { ConfirmDialog } from '@/components/jobs/confirm-dialog';
import { ListFooter } from '@/components/jobs/list-footer';
import {
  EMPLOYMENT_TYPE_LABEL,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  errorMessage,
} from '@/components/jobs/job-utils';
import { useFormatters } from '@/hooks/use-formatters';
import { useOrganizationAtsSettings } from '@/hooks/queries/use-ats-settings-query';
import {
  useClientQuery,
  useDeleteClientContactMutation,
  useDeleteClientMutation,
  useJobsQuery,
  useUpdateClientContactMutation,
  useUpdateClientMutation,
} from '@/hooks/queries';
import { usePermissions } from '@/hooks/use-permissions';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { toast } from '@/lib/toast';
import type { ClientContact, ClientDetail } from '@/types/client.type';

const JOBS_LIMIT = 10;

function InfoGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="break-words font-medium">
            {v || (
              <span className="font-normal text-muted-foreground">Not set</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ClientJobs({ client }: { client: ClientDetail }) {
  const [page, setPage] = useState(1);
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const fmt = useFormatters();
  const { data, isLoading } = useJobsQuery({
    page,
    limit: JOBS_LIMIT,
    clientId: client.id,
  });
  const jobs = data?.data ?? [];

  return (
    <SectionCard
      icon={Briefcase}
      title="Jobs"
      subtitle={`${client.openJobCount} open of ${client.jobCount}`}
      bodyClassName="p-0"
      actions={
        <PermissionGuard permissions={PERMISSIONS_ENUM.JOB_CREATE}>
          <ToolbarButton
            icon={Briefcase}
            onClick={() => setJobFormOpen(true)}
            disabled={client.status === 'retired'}
          >
            New job
          </ToolbarButton>
        </PermissionGuard>
      }
    >
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Loading jobs</p>
      ) : jobs.length === 0 ? (
        <EmptyState
          compact
          icon={<Briefcase className="h-6 w-6" />}
          title="No jobs for this client yet"
        />
      ) : (
        <>
          <ul className="divide-y divide-border">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/dashboard/jobs?id=${j.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{j.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        j.reference,
                        j.location,
                        EMPLOYMENT_TYPE_LABEL[j.employmentType],
                        fmt.pay(j),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {j.applicationCount}{' '}
                    {j.applicationCount === 1 ? 'applicant' : 'applicants'}
                  </span>
                  <StatusPill tone={JOB_STATUS_TONE[j.status]} dot>
                    {JOB_STATUS_LABEL[j.status]}
                  </StatusPill>
                </Link>
              </li>
            ))}
          </ul>
          {(data?.totalPages ?? 1) > 1 && (
            <ListFooter
              page={data?.page ?? page}
              limit={JOBS_LIMIT}
              total={data?.total ?? 0}
              totalPages={data?.totalPages ?? 1}
              onPageChange={setPage}
            />
          )}
        </>
      )}
      <JobFormDrawer
        open={jobFormOpen}
        onOpenChange={setJobFormOpen}
        defaultClientId={client.id}
      />
    </SectionCard>
  );
}

function ClientContacts({
  client,
  canUpdate,
}: {
  client: ClientDetail;
  canUpdate: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClientContact | null>(null);
  const [deleting, setDeleting] = useState<ClientContact | null>(null);
  const updateContact = useUpdateClientContactMutation();
  const deleteContact = useDeleteClientContactMutation();
  const contacts = [...client.contacts].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );

  const makePrimary = async (c: ClientContact) => {
    try {
      await updateContact.mutateAsync({
        clientId: client.id,
        contactId: c.id,
        data: { isPrimary: true },
      });
      toast.success(
        'Primary contact updated',
        `${c.firstName} ${c.lastName ?? ''}`.trim(),
      );
    } catch (e) {
      toast.error('Could not update contact', errorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteContact.mutateAsync({
        clientId: client.id,
        contactId: deleting.id,
      });
      toast.success('Contact removed');
    } catch (e) {
      toast.error('Could not remove contact', errorMessage(e));
      throw e;
    }
  };

  const actions = (c: ClientContact): RowAction[] => [
    {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onSelect: () => {
        setEditing(c);
        setDialogOpen(true);
      },
    },
    ...(!c.isPrimary
      ? [
          {
            label: 'Make primary',
            icon: <Star className="h-4 w-4" />,
            onSelect: () => makePrimary(c),
          },
        ]
      : []),
    {
      label: 'Remove',
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
      onSelect: () => setDeleting(c),
    },
  ];

  return (
    <SectionCard
      icon={Contact}
      title="Contacts"
      subtitle={`${client.contacts.length} ${client.contacts.length === 1 ? 'contact' : 'contacts'}`}
      bodyClassName="p-0"
      actions={
        canUpdate && (
          <ToolbarButton
            icon={UserPlus}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            Add contact
          </ToolbarButton>
        )
      }
    >
      {contacts.length === 0 ? (
        <EmptyState
          compact
          icon={<Contact className="h-6 w-6" />}
          title="No contacts yet"
        />
      ) : (
        <ul className="divide-y divide-border">
          {contacts.map((c) => {
            const name = `${c.firstName} ${c.lastName ?? ''}`.trim();
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <InitialsAvatar name={name} className="h-8 w-8 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {name}
                    {c.isPrimary && (
                      <StatusPill tone="info">Primary</StatusPill>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.jobTitle, c.email, c.phone]
                      .filter(Boolean)
                      .join(' · ') || 'No details'}
                  </p>
                </div>
                {canUpdate && <RowActions actions={actions(c)} />}
              </li>
            );
          })}
        </ul>
      )}
      <ClientContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={client.id}
        contact={editing}
        isFirst={client.contacts.length === 0}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Remove contact"
        description={
          deleting
            ? `${deleting.firstName} ${deleting.lastName ?? ''} will be removed from this client.`
            : undefined
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />
    </SectionCard>
  );
}

function ClientDetailsContent() {
  const router = useRouter();
  const id = useSearchParams().get('id');
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(PERMISSIONS_ENUM.CLIENT_UPDATE);
  const { data: client, isLoading, isError, error } = useClientQuery(id);
  const updateClient = useUpdateClientMutation();
  const deleteClient = useDeleteClientMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const atsSettings = useOrganizationAtsSettings();

  useBreadcrumb([
    { label: 'Clients', href: '/dashboard/clients' },
    { label: client?.name ?? 'Client', active: true },
  ]);

  useEffect(() => {
    if (isError) toast.error('Could not load client', errorMessage(error));
  }, [isError, error]);

  if (!id) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="No client selected"
        action={
          <Link href="/dashboard/clients">
            <ToolbarButton>Back to clients</ToolbarButton>
          </Link>
        }
      />
    );
  }

  if (isLoading) return <ListPageSkeleton filters={0} rows={4} />;

  if (!client) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="Client not found"
        description="It may have been deleted or you may not have access"
        action={
          <Link href="/dashboard/clients">
            <ToolbarButton>Back to clients</ToolbarButton>
          </Link>
        }
      />
    );
  }

  const toggleRetired = async () => {
    const next = client.status === 'active' ? 'retired' : 'active';
    try {
      await updateClient.mutateAsync({ id: client.id, data: { status: next } });
      toast.success(
        next === 'retired' ? 'Client retired' : 'Client reactivated',
        client.name,
      );
    } catch (e) {
      toast.error('Could not update client', errorMessage(e));
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteClient.mutateAsync(client.id);
      toast.success('Client deleted', client.name);
      router.push('/dashboard/clients');
    } catch (e) {
      toast.error('Could not delete client', errorMessage(e));
      throw e;
    }
  };

  const billing = client.billing ?? {};
  const orgCurrency = atsSettings.defaultCurrency;
  const owner = client.owner
    ? [client.owner.firstName, client.owner.lastName]
        .filter(Boolean)
        .join(' ') || client.owner.email
    : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ClientLogo
            name={client.name}
            logoUrl={client.logoUrl}
            brandColor={client.brandColor}
            className="h-11 w-11 text-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold">{client.name}</h1>
              <StatusPill tone={CLIENT_STATUS_TONE[client.status]} dot>
                {CLIENT_STATUS_LABEL[client.status]}
              </StatusPill>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {[client.industry, client.address?.city]
                .filter(Boolean)
                .join(' · ') || 'No industry set'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PermissionGuard permissions={PERMISSIONS_ENUM.CLIENT_DELETE}>
            <ToolbarButton icon={Trash2} onClick={() => setDeleteOpen(true)}>
              Delete
            </ToolbarButton>
          </PermissionGuard>
          {canUpdate && (
            <>
              <ToolbarButton
                icon={client.status === 'active' ? Archive : ArchiveRestore}
                onClick={toggleRetired}
                disabled={updateClient.isPending}
              >
                {client.status === 'active' ? 'Retire' : 'Reactivate'}
              </ToolbarButton>
              <ToolbarButton
                variant="primary"
                icon={Pencil}
                onClick={() => setFormOpen(true)}
              >
                Edit
              </ToolbarButton>
            </>
          )}
        </div>
      </div>

      <StatTileRow>
        <StatTile label="Open jobs" value={client.openJobCount} />
        <StatTile label="Total jobs" value={client.jobCount} />
        <StatTile label="Applications" value={client.applicationCount} />
        <StatTile label="Placements" value={client.placementCount} />
      </StatTileRow>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ClientJobs client={client} />
          <ClientContacts client={client} canUpdate={canUpdate} />
        </div>
        <div className="space-y-4">
          <SectionCard icon={Building2} title="Overview" bodyClassName="p-4">
            <InfoGrid
              items={[
                ['Legal name', client.legalName],
                [
                  'Website',
                  client.website && (
                    <a
                      href={
                        /^https?:\/\//.test(client.website)
                          ? client.website
                          : `https://${client.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#3F6650] hover:underline dark:text-emerald-400"
                    >
                      {client.website}
                    </a>
                  ),
                ],
                ['Phone', client.phone],
                ['Email', client.email],
                ['Address', formatAddress(client.address)],
                ['Owner', owner],
              ]}
            />
          </SectionCard>
          <SectionCard title="Billing" bodyClassName="p-4">
            <InfoGrid
              items={[
                ['Contact', billing.contactName],
                ['Email', billing.email],
                ['Phone', billing.phone],
                ['Payment terms', billing.paymentTerms],
                ['Currency', billing.currency || orgCurrency],
                [
                  'Brand colour',
                  client.brandColor && (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: client.brandColor }}
                      />
                      {client.brandColor}
                    </span>
                  ),
                ],
              ]}
            />
          </SectionCard>
          <SectionCard title="Notes" bodyClassName="p-4">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {client.notes || 'No notes'}
            </p>
          </SectionCard>
        </div>
      </div>

      <ClientFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        client={client}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete client"
        description={`${client.name} and its contacts will be removed, its jobs will be unlinked. This cannot be undone.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function ClientDetailsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton filters={0} rows={4} />}>
      <ClientDetailsContent />
    </Suspense>
  );
}
