'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Filter,
  Calendar,
  Users,
  Building2,
  MapPin,
  Star,
  Briefcase,
  FileText,
  DollarSign,
  Settings2,
  Columns3,
  LayoutGrid,
  List,
  CalendarDays,
  SlidersHorizontal,
  MoreHorizontal,
  Tag,
  Trash2,
  ArrowRightLeft,
  UserPlus,
  Bookmark,
  Play,
  Upload,
} from 'lucide-react';
import {
  FilterBar,
  FilterDropdown,
  ToggleControl,
  RefreshButton,
  SearchInput,
  SegmentedControl,
  ToolbarButton,
  IconButton,
  ExportButton,
  ImportButton,
  MultiFilter,
  FilterChips,
  SelectionBar,
  AvatarStack,
  StatusPill,
} from '@/components/patterns';

function Example({
  n,
  title,
  desc,
  children,
}: {
  n: number;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-baseline gap-2 border-b border-border px-4 py-2.5">
        <span className="text-xs font-semibold text-muted-foreground">
          {String(n).padStart(2, '0')}
        </span>
        <span className="text-sm font-medium">{title}</span>
        <span className="truncate text-xs text-muted-foreground">· {desc}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

const RANGE = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This quarter', value: 'q' },
];

export default function ToolbarReferencePage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'board' | 'table' | 'calendar'>('table');
  const [statusSel, setStatusSel] = useState<string[]>([
    'active',
    'onboarding',
  ]);
  const [tab, setTab] = useState<'all' | 'active' | 'archived'>('all');
  const [chips, setChips] = useState([
    { key: 'dept', label: 'Department', value: 'Engineering' },
    { key: 'loc', label: 'Location', value: 'Remote' },
    { key: 'stage', label: 'Stage', value: 'Interview' },
  ]);

  const STATUS_OPTS = [
    { label: 'Active', value: 'active' },
    { label: 'Onboarding', value: 'onboarding' },
    { label: 'On leave', value: 'inactive' },
  ];

  const toggleStatus = (v: string) =>
    setStatusSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/dashboard/components"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to components
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Toolbar reference</h1>
          <p className="text-sm text-muted-foreground">
            Toolbar configurations for different table types across actions,
            filters, views, selection, and presets
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Example
          n={1}
          title="Search + filter + export"
          desc="the default list toolbar"
        >
          <FilterBar end={<ExportButton />}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search..."
            />
            <FilterDropdown
              value="7d"
              options={RANGE}
              onChange={() => {}}
              label="Range"
            />
          </FilterBar>
        </Example>

        <Example n={2} title="Primary action + search" desc="create-first list">
          <FilterBar
            end={
              <ToolbarButton variant="primary" icon={Plus}>
                New job
              </ToolbarButton>
            }
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search jobs..."
            />
          </FilterBar>
        </Example>

        <Example n={3} title="Export (split)" desc="CSV / Excel / PDF">
          <FilterBar>
            <ExportButton formats={['CSV', 'Excel', 'PDF']} />
          </FilterBar>
        </Example>

        <Example n={4} title="Import + Export cluster" desc="data in/out">
          <FilterBar
            end={
              <>
                <ImportButton />
                <ExportButton />
              </>
            }
          >
            <SearchInput value={search} onChange={setSearch} />
          </FilterBar>
        </Example>

        <Example
          n={5}
          title="Icon button cluster"
          desc="columns, density, settings, more"
        >
          <FilterBar
            end={
              <>
                <IconButton icon={Columns3} label="Columns" />
                <IconButton icon={SlidersHorizontal} label="Density" />
                <IconButton icon={Settings2} label="Settings" />
                <IconButton icon={MoreHorizontal} label="More" />
              </>
            }
          >
            <SearchInput value={search} onChange={setSearch} />
          </FilterBar>
        </Example>

        <Example n={6} title="Add + Import + Export" desc="full action cluster">
          <FilterBar
            end={
              <>
                <ImportButton />
                <ExportButton />
                <ToolbarButton variant="primary" icon={Plus}>
                  Add
                </ToolbarButton>
              </>
            }
          >
            <SearchInput value={search} onChange={setSearch} />
          </FilterBar>
        </Example>

        <Example n={7} title="Multi-select filters" desc="with active counts">
          <FilterBar>
            <MultiFilter
              label="Status"
              icon={Filter}
              options={STATUS_OPTS}
              selected={statusSel}
              onToggle={toggleStatus}
            />
            <MultiFilter
              label="Department"
              icon={Building2}
              options={[
                { label: 'Engineering', value: 'eng' },
                { label: 'Design', value: 'design' },
                { label: 'Sales', value: 'sales' },
              ]}
              selected={[]}
              onToggle={() => {}}
            />
          </FilterBar>
        </Example>

        <Example n={8} title="Active filter chips" desc="removable tokens">
          <FilterChips
            filters={chips}
            onRemove={(k) => setChips((c) => c.filter((f) => f.key !== k))}
            onClearAll={() => setChips([])}
          />
        </Example>

        <Example n={9} title="Group-by + Sort" desc="organize the list">
          <FilterBar>
            <FilterDropdown
              label="Group"
              value="stage"
              options={[
                { label: 'Stage', value: 'stage' },
                { label: 'Source', value: 'source' },
                { label: 'Owner', value: 'owner' },
              ]}
              onChange={() => {}}
            />
            <FilterDropdown
              label="Sort"
              value="recent"
              options={[
                { label: 'Most recent', value: 'recent' },
                { label: 'Name A-Z', value: 'az' },
                { label: 'Rating', value: 'rating' },
              ]}
              onChange={() => {}}
            />
          </FilterBar>
        </Example>

        <Example n={10} title="Date range + compare" desc="analytics header">
          <FilterBar end={<RefreshButton onClick={() => {}} />}>
            <FilterDropdown
              icon={Calendar}
              value="30d"
              options={RANGE}
              onChange={() => {}}
            />
            <FilterDropdown
              value="daily"
              label="Interval"
              options={[
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
              ]}
              onChange={() => {}}
            />
            <ToggleControl label="Compare" checked onCheckedChange={() => {}} />
          </FilterBar>
        </Example>

        <Example
          n={11}
          title="Assignee + status + search"
          desc="ownership filters"
        >
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} />
            <button className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-[13px] font-medium hover:bg-accent">
              <AvatarStack
                items={[{ name: 'Aisha Khan' }, { name: 'Tom Ford' }]}
                size={20}
              />
              Assignee
            </button>
            <MultiFilter
              label="Status"
              options={STATUS_OPTS}
              selected={statusSel}
              onToggle={toggleStatus}
            />
          </FilterBar>
        </Example>

        <Example
          n={12}
          title="Full analytics toolbar"
          desc="many dropdowns (dense)"
        >
          <FilterBar
            end={
              <>
                <RefreshButton onClick={() => {}} />
                <ExportButton />
              </>
            }
          >
            <FilterDropdown
              value="brand"
              options={[{ label: 'Brand', value: 'brand' }]}
              onChange={() => {}}
            />
            <FilterDropdown
              icon={Calendar}
              value="7d"
              options={RANGE}
              onChange={() => {}}
            />
            <FilterDropdown
              value="daily"
              options={[{ label: 'Daily', value: 'daily' }]}
              onChange={() => {}}
            />
            <FilterDropdown
              value="models"
              label="Models"
              options={[{ label: 'All', value: 'models' }]}
              onChange={() => {}}
            />
            <ToggleControl
              label="Unbranded"
              checked={false}
              onCheckedChange={() => {}}
            />
          </FilterBar>
        </Example>

        <Example n={13} title="View toggle" desc="Board / Table / Calendar">
          <FilterBar
            end={
              <SegmentedControl
                value={view}
                onChange={setView}
                options={[
                  {
                    value: 'board',
                    icon: <LayoutGrid className="h-4 w-4" />,
                    label: 'Board',
                  },
                  {
                    value: 'table',
                    icon: <List className="h-4 w-4" />,
                    label: 'Table',
                  },
                  {
                    value: 'calendar',
                    icon: <CalendarDays className="h-4 w-4" />,
                    label: 'Calendar',
                  },
                ]}
              />
            }
          >
            <SearchInput value={search} onChange={setSearch} />
          </FilterBar>
        </Example>

        <Example
          n={14}
          title="Tabs with counts + action"
          desc="status segments"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              value={tab}
              onChange={setTab}
              options={[
                { value: 'all', label: 'All 141' },
                { value: 'active', label: 'Active 128' },
                { value: 'archived', label: 'Archived 13' },
              ]}
            />
            <ToolbarButton variant="primary" icon={Plus}>
              Add
            </ToolbarButton>
          </div>
        </Example>

        <Example
          n={15}
          title="Saved views"
          desc="views dropdown + star + refresh"
        >
          <FilterBar end={<RefreshButton onClick={() => {}} />}>
            <FilterDropdown
              icon={Bookmark}
              value="my"
              options={[
                { label: 'My candidates', value: 'my' },
                { label: 'Hot leads', value: 'hot' },
                { label: 'All', value: 'all' },
              ]}
              onChange={() => {}}
            />
            <IconButton icon={Star} label="Favourite view" />
          </FilterBar>
        </Example>

        <Example n={16} title="Selection bar" desc="bulk actions on N rows">
          <SelectionBar
            count={3}
            onClear={() => {}}
            actions={
              <>
                <ToolbarButton icon={UserPlus}>Assign</ToolbarButton>
                <ToolbarButton icon={Tag}>Tag</ToolbarButton>
                <ToolbarButton icon={ArrowRightLeft}>Move stage</ToolbarButton>
                <ToolbarButton variant="danger" icon={Trash2}>
                  Delete
                </ToolbarButton>
              </>
            }
          />
        </Example>

        <Example
          n={17}
          title="Selection bar (destructive)"
          desc="bulk delete emphasis"
        >
          <SelectionBar
            count={12}
            onClear={() => {}}
            actions={
              <>
                <ToolbarButton icon={ArrowRightLeft}>Move</ToolbarButton>
                <ToolbarButton variant="danger" icon={Trash2}>
                  Delete 12
                </ToolbarButton>
              </>
            }
          />
        </Example>

        <Example n={18} title="Candidates" desc="stage + source + rating + add">
          <FilterBar
            end={
              <>
                <ExportButton />
                <ToolbarButton variant="primary" icon={UserPlus}>
                  Add candidate
                </ToolbarButton>
              </>
            }
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search candidates..."
            />
            <FilterDropdown
              label="Stage"
              value="all"
              options={[
                { label: 'All stages', value: 'all' },
                { label: 'Interview', value: 'iv' },
              ]}
              onChange={() => {}}
            />
            <MultiFilter
              label="Source"
              options={[
                { label: 'LinkedIn', value: 'li' },
                { label: 'Referral', value: 'ref' },
              ]}
              selected={[]}
              onToggle={() => {}}
            />
          </FilterBar>
        </Example>

        <Example n={19} title="Employees" desc="department + location + status">
          <FilterBar end={<ExportButton />}>
            <SearchInput value={search} onChange={setSearch} />
            <FilterDropdown
              icon={Building2}
              label="Dept"
              value="all"
              options={[{ label: 'All', value: 'all' }]}
              onChange={() => {}}
            />
            <FilterDropdown
              icon={MapPin}
              label="Location"
              value="all"
              options={[{ label: 'All', value: 'all' }]}
              onChange={() => {}}
            />
            <MultiFilter
              label="Status"
              options={STATUS_OPTS}
              selected={statusSel}
              onToggle={toggleStatus}
            />
          </FilterBar>
        </Example>

        <Example
          n={20}
          title="Interviews"
          desc="date + interviewer + type + schedule"
        >
          <FilterBar
            end={
              <ToolbarButton variant="primary" icon={CalendarDays}>
                Schedule
              </ToolbarButton>
            }
          >
            <FilterDropdown
              icon={Calendar}
              value="week"
              options={[
                { label: 'This week', value: 'week' },
                { label: 'Today', value: 'today' },
              ]}
              onChange={() => {}}
            />
            <FilterDropdown
              icon={Users}
              label="Interviewer"
              value="any"
              options={[{ label: 'Anyone', value: 'any' }]}
              onChange={() => {}}
            />
            <FilterDropdown
              label="Type"
              value="all"
              options={[
                { label: 'All', value: 'all' },
                { label: 'Technical', value: 'tech' },
              ]}
              onChange={() => {}}
            />
          </FilterBar>
        </Example>

        <Example n={21} title="Documents" desc="type + upload + search">
          <FilterBar
            end={
              <ToolbarButton variant="primary" icon={Upload}>
                Upload
              </ToolbarButton>
            }
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search files..."
            />
            <FilterDropdown
              icon={FileText}
              label="Type"
              value="all"
              options={[
                { label: 'All types', value: 'all' },
                { label: 'PDF', value: 'pdf' },
              ]}
              onChange={() => {}}
            />
          </FilterBar>
        </Example>

        <Example n={22} title="Payroll" desc="period + status + run + export">
          <FilterBar
            end={
              <>
                <ExportButton />
                <ToolbarButton variant="primary" icon={Play}>
                  Run payroll
                </ToolbarButton>
              </>
            }
          >
            <FilterDropdown
              icon={Calendar}
              label="Period"
              value="sep"
              options={[{ label: 'Sep 2026', value: 'sep' }]}
              onChange={() => {}}
            />
            <MultiFilter
              label="Status"
              icon={DollarSign}
              options={[
                { label: 'Paid', value: 'paid' },
                { label: 'Pending', value: 'pending' },
              ]}
              selected={['pending']}
              onToggle={() => {}}
            />
          </FilterBar>
        </Example>

        <Example
          n={23}
          title="Jobs / requisitions"
          desc="status + dept + new job"
        >
          <FilterBar
            end={
              <ToolbarButton variant="primary" icon={Briefcase}>
                New job
              </ToolbarButton>
            }
          >
            <SearchInput value={search} onChange={setSearch} />
            <MultiFilter
              label="Status"
              options={[
                { label: 'Open', value: 'open' },
                { label: 'Closed', value: 'closed' },
              ]}
              selected={['open']}
              onToggle={() => {}}
            />
            <FilterDropdown
              icon={Building2}
              label="Dept"
              value="all"
              options={[{ label: 'All', value: 'all' }]}
              onChange={() => {}}
            />
          </FilterBar>
        </Example>

        <Example n={24} title="Minimal" desc="search only">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search..."
            />
          </FilterBar>
        </Example>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 p-4">
        <StatusPill tone="info">Tip</StatusPill>
        <span className="text-sm text-muted-foreground">
          Mix and match these building blocks inside a <code>SectionCard</code>{' '}
          or above a <code>DataTable</code>, all sharing the 32px pill height
          and the same weight hierarchy
        </span>
      </div>
    </div>
  );
}
