'use client';

import { useMemo, useState } from 'react';
import { Check, Clock, FilePlus2, Send, Undo2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  DataGrid,
  DetailDrawer,
  DetailPanel,
  ExportButton,
  FilterBar,
  MultiFilter,
  NotIntegratedBadge,
  PanelSection,
  SearchInput,
  StatTile,
  StatTileRow,
  StatusPill,
  ToolbarButton,
  type DataGridColumn,
  type PillTone,
} from '@/components/patterns';
import {
  OfferFormDrawer,
  type OfferFormValues,
} from '@/components/offers/offer-form-drawer';
import { downloadCsv } from '@/lib/export-csv';
import { toast } from '@/lib/toast';

type OfferStatus =
  | 'Draft'
  | 'Pending approval'
  | 'Approved'
  | 'Sent'
  | 'Accepted'
  | 'Declined'
  | 'Withdrawn';

interface Approver {
  name: string;
  approved: boolean;
}

interface Offer {
  id: string;
  candidate: string;
  role: string;
  department: string;
  location: string;
  salary: string;
  equity: string;
  startDate: string;
  approvers: Approver[];
  status: OfferStatus;
  updated: string;
  notes?: string;
}

const STATUS_TONE: Record<OfferStatus, PillTone> = {
  Draft: 'neutral',
  'Pending approval': 'warning',
  Approved: 'info',
  Sent: 'purple',
  Accepted: 'success',
  Declined: 'danger',
  Withdrawn: 'neutral',
};

const ALL_STATUSES: OfferStatus[] = [
  'Draft',
  'Pending approval',
  'Approved',
  'Sent',
  'Accepted',
  'Declined',
  'Withdrawn',
];

function chain(names: string[], approvedCount: number): Approver[] {
  return names.map((name, i) => ({ name, approved: i < approvedCount }));
}

const STD = ['Vikram Joshi', 'Finance', 'People lead'];

const SEED: Offer[] = [
  {
    id: 'o1',
    candidate: 'Meera Pillai',
    role: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Bengaluru',
    salary: '₹38,00,000',
    equity: '2,400 RSU',
    startDate: '2026-11-02',
    approvers: chain(STD, 3),
    status: 'Accepted',
    updated: '2026-10-12',
  },
  {
    id: 'o2',
    candidate: 'Sophie Laurent',
    role: 'Product Designer',
    department: 'Design',
    location: 'London',
    salary: '£78,000',
    equity: '1,800 RSU',
    startDate: '2026-11-16',
    approvers: chain(STD, 1),
    status: 'Pending approval',
    updated: '2026-10-11',
  },
  {
    id: 'o3',
    candidate: 'Aarav Mehta',
    role: 'Senior Backend Engineer',
    department: 'Engineering',
    location: 'Remote',
    salary: '₹52,00,000',
    equity: '3,000 RSU',
    startDate: '2026-11-09',
    approvers: chain(STD, 0),
    status: 'Draft',
    updated: '2026-10-11',
  },
  {
    id: 'o4',
    candidate: 'Lukas Schmidt',
    role: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Berlin',
    salary: '€84,000',
    equity: '1,500 RSU',
    startDate: '2026-11-01',
    approvers: chain(STD, 3),
    status: 'Sent',
    updated: '2026-10-10',
  },
  {
    id: 'o5',
    candidate: 'Priya Nair',
    role: 'HR Business Partner',
    department: 'People',
    location: 'Bengaluru',
    salary: '₹24,00,000',
    equity: '600 RSU',
    startDate: '2026-10-26',
    approvers: chain(STD, 3),
    status: 'Accepted',
    updated: '2026-10-08',
  },
  {
    id: 'o6',
    candidate: 'James Walker',
    role: 'Sales Executive',
    department: 'Sales',
    location: 'Austin',
    salary: '$92,000 + OTE',
    equity: '400 RSU',
    startDate: '2026-11-02',
    approvers: chain(['Olivia Brown', 'Finance'], 2),
    status: 'Declined',
    updated: '2026-10-07',
  },
  {
    id: 'o7',
    candidate: 'Ana Costa',
    role: 'Data Analyst',
    department: 'Data',
    location: 'Remote',
    salary: '$88,000',
    equity: '900 RSU',
    startDate: '2026-11-23',
    approvers: chain(STD, 2),
    status: 'Pending approval',
    updated: '2026-10-07',
  },
  {
    id: 'o8',
    candidate: 'Wei Chen',
    role: 'QA Engineer',
    department: 'Engineering',
    location: 'Singapore',
    salary: 'S$96,000',
    equity: '700 RSU',
    startDate: '2026-11-09',
    approvers: chain(STD, 3),
    status: 'Approved',
    updated: '2026-10-06',
  },
  {
    id: 'o9',
    candidate: 'Rohan Gupta',
    role: 'Product Manager, Growth',
    department: 'Product',
    location: 'Bengaluru',
    salary: '₹46,00,000',
    equity: '2,000 RSU',
    startDate: '2026-10-19',
    approvers: chain(STD, 3),
    status: 'Accepted',
    updated: '2026-10-02',
  },
  {
    id: 'o10',
    candidate: 'Emily Davis',
    role: 'Marketing Lead',
    department: 'Marketing',
    location: 'London',
    salary: '£72,000',
    equity: '1,000 RSU',
    startDate: '2026-11-30',
    approvers: chain(STD, 3),
    status: 'Sent',
    updated: '2026-10-01',
  },
];

function approvalLabel(o: Offer) {
  return `${o.approvers.filter((a) => a.approved).length} / ${o.approvers.length}`;
}

const columns: DataGridColumn<Offer>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    width: 200,
    render: (r) => (
      <span className="flex items-center gap-2">
        <InitialsAvatar name={r.candidate} className="h-6 w-6 text-[10px]" />
        <span className="font-medium">{r.candidate}</span>
      </span>
    ),
  },
  { key: 'role', header: 'Role', width: 200 },
  { key: 'department', header: 'Department', width: 120 },
  { key: 'location', header: 'Location', width: 110 },
  {
    key: 'salary',
    header: 'Base salary',
    width: 140,
    align: 'right',
    mono: true,
  },
  { key: 'equity', header: 'Equity', width: 110, align: 'right', mono: true },
  {
    key: 'approvals',
    header: 'Approvals',
    width: 100,
    align: 'right',
    mono: true,
    render: (r) => approvalLabel(r),
  },
  { key: 'startDate', header: 'Start date', width: 110, mono: true },
  {
    key: 'status',
    header: 'Status',
    width: 150,
    render: (r) => (
      <StatusPill tone={STATUS_TONE[r.status]} dot>
        {r.status}
      </StatusPill>
    ),
  },
  { key: 'updated', header: 'Updated', width: 110, mono: true },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(SEED);
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offers.filter(
      (o) =>
        (!q ||
          o.candidate.toLowerCase().includes(q) ||
          o.role.toLowerCase().includes(q)) &&
        (statuses.length === 0 || statuses.includes(o.status)),
    );
  }, [offers, search, statuses]);

  const stats = useMemo(() => {
    const accepted = offers.filter((o) => o.status === 'Accepted').length;
    const declined = offers.filter((o) => o.status === 'Declined').length;
    const decided = accepted + declined;
    return {
      out: offers.filter((o) => o.status === 'Sent').length,
      pending: offers.filter((o) => o.status === 'Pending approval').length,
      drafts: offers.filter((o) => o.status === 'Draft').length,
      rate: decided ? Math.round((accepted / decided) * 100) : 0,
    };
  }, [offers]);

  const detail = offers.find((o) => o.id === detailId) ?? null;

  const toggleStatus = (v: string) =>
    setStatuses((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const update = (id: string, fn: (o: Offer) => Offer) =>
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...fn(o), updated: today() } : o)),
    );

  const handleCreate = (values: OfferFormValues) => {
    const offer: Offer = {
      id: `o${Date.now()}`,
      candidate: values.candidate,
      role: values.role,
      department: values.department,
      location: values.location,
      salary: `${values.currency}${values.salary}`,
      equity: values.equity || 'None',
      startDate: values.startDate,
      approvers: values.approvers.map((name) => ({ name, approved: false })),
      status: 'Draft',
      updated: today(),
      notes: values.notes,
    };
    setOffers((prev) => [offer, ...prev]);
    toast.success('Offer drafted', `${values.candidate}, ${values.role}`);
  };

  const submitForApproval = (o: Offer) => {
    update(o.id, (x) => ({ ...x, status: 'Pending approval' }));
    toast.success(
      'Sent for approval',
      `Waiting on ${o.approvers[0]?.name ?? 'approvers'}`,
    );
  };

  const approve = (o: Offer) => {
    const next = o.approvers.findIndex((a) => !a.approved);
    if (next === -1) return;
    const approvers = o.approvers.map((a, i) =>
      i === next ? { ...a, approved: true } : a,
    );
    const done = approvers.every((a) => a.approved);
    update(o.id, (x) => ({
      ...x,
      approvers,
      status: done ? 'Approved' : 'Pending approval',
    }));
    toast.success(
      done ? 'Offer fully approved' : `Approved by ${o.approvers[next].name}`,
      done
        ? 'Ready to send to the candidate'
        : `Next: ${approvers.find((a) => !a.approved)?.name}`,
    );
  };

  const setStatus = (o: Offer, status: OfferStatus, title: string) => {
    update(o.id, (x) => ({ ...x, status }));
    toast.success(title, o.candidate);
  };

  const exportRows = () =>
    downloadCsv('offers', rows, [
      { header: 'Candidate', value: (r) => r.candidate },
      { header: 'Role', value: (r) => r.role },
      { header: 'Department', value: (r) => r.department },
      { header: 'Location', value: (r) => r.location },
      { header: 'Base salary', value: (r) => r.salary },
      { header: 'Equity', value: (r) => r.equity },
      { header: 'Approvals', value: (r) => approvalLabel(r) },
      { header: 'Start date', value: (r) => r.startDate },
      { header: 'Status', value: (r) => r.status },
      { header: 'Updated', value: (r) => r.updated },
    ]);

  const nextApprover = detail?.approvers.find((a) => !a.approved);
  const closed =
    detail && ['Accepted', 'Declined', 'Withdrawn'].includes(detail.status);

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <StatTileRow>
        <StatTile label="Offers out" value={stats.out} className="p-4" />
        <StatTile
          label="Awaiting approval"
          value={stats.pending}
          tone={stats.pending ? 'warning' : 'default'}
          className="p-4"
        />
        <StatTile
          label="Acceptance rate"
          value={stats.rate}
          unit="% of decided offers"
          tone="positive"
          className="p-4"
        />
        <StatTile label="Drafts" value={stats.drafts} className="p-4" />
      </StatTileRow>

      <FilterBar
        end={
          <>
            <NotIntegratedBadge />
            <ExportButton formats={['CSV']} onExport={exportRows} />
            <ToolbarButton
              variant="primary"
              icon={FilePlus2}
              onClick={() => setFormOpen(true)}
            >
              New offer
            </ToolbarButton>
          </>
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search offers..."
        />
        <MultiFilter
          label="Status"
          selected={statuses}
          onToggle={toggleStatus}
          options={ALL_STATUSES.map((s) => ({ label: s, value: s }))}
        />
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col">
        <DataGrid
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          onRowClick={(r) => setDetailId(r.id)}
          pinFirstColumn
          maxHeight="100%"
          className="flex-1"
        />
        <div className="flex items-center justify-between border border-t-0 border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Showing {rows.length} of {offers.length}
          </span>
        </div>
      </div>

      <OfferFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      <DetailDrawer
        open={detail !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
        title={detail ? `Offer for ${detail.candidate}` : ''}
        chips={
          detail && (
            <StatusPill tone={STATUS_TONE[detail.status]} dot>
              {detail.status}
            </StatusPill>
          )
        }
        footer={
          detail && (
            <div className="flex items-center justify-between gap-2">
              {!closed ? (
                <ToolbarButton
                  variant="ghost"
                  icon={Undo2}
                  onClick={() =>
                    setStatus(detail, 'Withdrawn', 'Offer withdrawn')
                  }
                >
                  Withdraw
                </ToolbarButton>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                {detail.status === 'Draft' && (
                  <ToolbarButton
                    variant="primary"
                    icon={Send}
                    onClick={() => submitForApproval(detail)}
                  >
                    Submit for approval
                  </ToolbarButton>
                )}
                {detail.status === 'Pending approval' && (
                  <ToolbarButton
                    variant="primary"
                    icon={Check}
                    onClick={() => approve(detail)}
                  >
                    Approve{nextApprover ? ` as ${nextApprover.name}` : ''}
                  </ToolbarButton>
                )}
                {detail.status === 'Approved' && (
                  <ToolbarButton
                    variant="primary"
                    icon={Send}
                    onClick={() =>
                      setStatus(detail, 'Sent', 'Offer sent to candidate')
                    }
                  >
                    Send to candidate
                  </ToolbarButton>
                )}
                {detail.status === 'Sent' && (
                  <>
                    <ToolbarButton
                      icon={X}
                      onClick={() =>
                        setStatus(detail, 'Declined', 'Offer marked declined')
                      }
                    >
                      Mark declined
                    </ToolbarButton>
                    <ToolbarButton
                      variant="primary"
                      icon={Check}
                      onClick={() =>
                        setStatus(detail, 'Accepted', 'Offer accepted')
                      }
                    >
                      Mark accepted
                    </ToolbarButton>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {detail && (
          <DetailPanel>
            <div className="flex items-center gap-3">
              <InitialsAvatar
                name={detail.candidate}
                className="h-10 w-10 text-sm"
              />
              <div>
                <p className="font-semibold">{detail.candidate}</p>
                <p className="text-sm text-muted-foreground">
                  {detail.role} · {detail.department}
                </p>
              </div>
            </div>

            <PanelSection title="Compensation">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-3 text-sm">
                {[
                  ['Base salary', detail.salary],
                  ['Equity', detail.equity],
                  ['Location', detail.location],
                  ['Start date', detail.startDate],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </PanelSection>

            <PanelSection title={`Approval chain · ${approvalLabel(detail)}`}>
              <ol className="divide-y divide-border rounded-md border border-border">
                {detail.approvers.map((a, i) => {
                  const isNext =
                    detail.status === 'Pending approval' && a === nextApprover;
                  return (
                    <li
                      key={a.name}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm"
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                          a.approved
                            ? 'bg-[#3F6650] text-white dark:bg-[#8FBFA1] dark:text-[#0f1a14]'
                            : 'border border-border text-muted-foreground',
                        )}
                      >
                        {a.approved ? <Check className="h-3 w-3" /> : i + 1}
                      </span>
                      <span className="flex-1">{a.name}</span>
                      {a.approved ? (
                        <StatusPill tone="success">Approved</StatusPill>
                      ) : (
                        <StatusPill
                          tone={isNext ? 'warning' : 'neutral'}
                          icon={
                            isNext ? <Clock className="h-3 w-3" /> : undefined
                          }
                        >
                          {isNext ? 'Waiting' : 'Pending'}
                        </StatusPill>
                      )}
                    </li>
                  );
                })}
              </ol>
            </PanelSection>

            {detail.notes && (
              <PanelSection title="Notes">
                <p className="text-sm text-muted-foreground">{detail.notes}</p>
              </PanelSection>
            )}
          </DetailPanel>
        )}
      </DetailDrawer>
    </div>
  );
}
