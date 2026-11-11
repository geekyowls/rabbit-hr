export type IntegrationLevel = 'integrated' | 'partial' | 'none' | 'static';

export interface PageIntegrationStatus {
  level: IntegrationLevel;
  live?: string[];
  preview?: string[];
}

const SETTINGS_LIVE: PageIntegrationStatus = { level: 'integrated' };

export const PAGE_INTEGRATION_STATUS: Record<string, PageIntegrationStatus> = {
  '/dashboard': {
    level: 'partial',
    live: [
      'KPI tiles',
      'Applications to review',
      'Hiring funnel',
      'Applications chart',
      'Applications by client',
      'Recent activity',
      'My open tasks',
    ],
    preview: [
      'Scorecards, interviews and offers tiles',
      'Time to hire',
      'Needs attention',
      'Source of hire',
      'Hiring plan',
      'Recruiter workload',
      'Open roles',
      "Today's interviews",
      'Agents this week',
      'Upcoming starts',
    ],
  },
  '/dashboard/jobs': {
    level: 'integrated',
    live: [
      'Job list, filters and search',
      'Create and edit',
      'Status changes',
      'Job detail',
    ],
    preview: ['Department', 'Hiring team'],
  },
  '/dashboard/clients': {
    level: 'integrated',
    live: ['Client list', 'Create and edit', 'Retire and delete'],
  },
  '/dashboard/clients/details': {
    level: 'integrated',
    live: ['Client overview', 'Contacts', 'Jobs for this client', 'Billing'],
  },
  '/dashboard/candidates': {
    level: 'integrated',
    live: [
      'Candidate list, filters and search',
      'Add candidate with CV',
      'Applications and stage changes',
      'Notes and activity',
      'Documents',
      'Tasks',
      'Send email',
    ],
    preview: [
      'AI summary and insights',
      'Schedule',
      'Other profiles',
      'Private notes',
      'Write with AI',
    ],
  },
  '/dashboard/pipeline': {
    level: 'integrated',
    live: [
      'Board and list view',
      'Drag and drop stages',
      'Reject with reason',
      'Job summary',
    ],
    preview: [
      'Match score and next step',
      'Interviewer avatars',
      'Hiring manager',
    ],
  },
  '/dashboard/tasks': {
    level: 'integrated',
    live: ['Task list and filters', 'Create, edit, complete, delete'],
  },
  '/dashboard/interviews': {
    level: 'none',
    preview: ['Whole page uses sample data'],
  },
  '/dashboard/offers': {
    level: 'none',
    preview: ['Whole page uses sample data'],
  },
  '/dashboard/reports': {
    level: 'none',
    preview: ['Whole page uses sample data'],
  },
  '/dashboard/agents': {
    level: 'none',
    preview: ['Whole page uses sample data'],
  },
  '/dashboard/agents/new': {
    level: 'none',
    preview: ['Whole page uses sample data'],
  },
  '/dashboard/components': { level: 'static' },
  '/dashboard/components/toolbars': { level: 'static' },
  '/dashboard/help': { level: 'static' },
  '/dashboard/settings': SETTINGS_LIVE,
  '/dashboard/settings/general': SETTINGS_LIVE,
  '/dashboard/settings/organization': SETTINGS_LIVE,
  '/dashboard/settings/users': SETTINGS_LIVE,
  '/dashboard/settings/roles': SETTINGS_LIVE,
  '/dashboard/settings/roles/new': SETTINGS_LIVE,
  '/dashboard/settings/roles/edit': SETTINGS_LIVE,
  '/dashboard/settings/integrations': SETTINGS_LIVE,
  '/dashboard/settings/audit': SETTINGS_LIVE,
  '/dashboard/settings/email-templates': SETTINGS_LIVE,
};

export const SHOW_INTEGRATION_STATUS =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_SHOW_INTEGRATION_STATUS === 'true';
