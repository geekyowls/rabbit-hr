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
      'Scorecards to submit',
      'Interviews next 7 days',
      'Offers to approve',
      'Time to hire',
      'Hiring funnel',
      'Applications chart',
      'Source of hire',
      'Applications by client',
      'Recruiter workload',
      "Today's interviews",
      'Recent activity',
      'My open tasks',
      'Upcoming starts',
    ],
    preview: [
      'Needs attention',
      'Hiring plan',
      'Open roles',
      'Agents this week',
    ],
  },
  '/dashboard/jobs': {
    level: 'integrated',
    live: [
      'Job list, filters and search',
      'Create and edit',
      'Status changes',
      'Job detail',
      'Department and hiring team',
      'Department and hiring manager filters',
      'Custom fields',
      'Currency and formatting from hiring preferences',
    ],
  },
  '/dashboard/clients': {
    level: 'integrated',
    live: ['Client list', 'Create and edit', 'Retire and delete'],
  },
  '/dashboard/clients/details': {
    level: 'integrated',
    live: [
      'Client overview',
      'Contacts',
      'Jobs for this client',
      'Billing',
      'Linked email threads when a mailbox is connected',
    ],
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
      'Custom fields',
      'Expected salary in organization currency',
      'Schedule interviews and interview history',
      'Make offer from an application',
      'Email from your connected mailbox, linked threads and replies',
      'Click to call with recording, outcome and notes when calling is connected',
      'WhatsApp template messages and history when WhatsApp is connected',
      'Interview booking links from an application',
    ],
    preview: [
      'AI summary and insights',
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
      'Hiring manager, recruiter and department',
      'Custom pipeline stages',
      'Next scheduled interview on cards',
    ],
    preview: ['Match score and next step'],
  },
  '/dashboard/tasks': {
    level: 'integrated',
    live: ['Task list and filters', 'Create, edit, complete, delete'],
  },
  '/dashboard/interviews': {
    level: 'integrated',
    live: [
      'Upcoming, needs feedback and past lists',
      'Mine or everyone, role and status filters',
      'Schedule, edit and reschedule',
      'Complete, no show, cancel with reason, delete',
      'Scorecards with criteria and recommendation',
      'Candidate emails and move to interview stage',
      'Automatic meeting links for connected Google Meet, Teams and Zoom',
      'Calendar sync status on the interview',
      'Send booking link and booking links list with cancel',
    ],
  },
  '/dashboard/inbox': {
    level: 'integrated',
    live: [
      'Stats, mailbox switcher, folders, search and filters',
      'Thread list and reading pane with layout toggle',
      'Read, unread, archive and trash',
      'Link and unlink candidate, unlink client',
      'Reply, reply all and compose with templates',
      'Demo mailbox data',
    ],
    preview: ['Attachment download'],
  },
  '/dashboard/offers': {
    level: 'integrated',
    live: [
      'Offer list, status counts, job and client filters, search',
      'Create and edit with approvers and letter',
      'Prefill from candidate via applicationId',
      'Submit, approve, reject, send, record response, withdraw, delete',
      'Approvals and offer activity',
      'Salary in the offer currency',
      'E-signature status, signing link and public signing page',
    ],
  },
  '/dashboard/reports': {
    level: 'integrated',
    live: [
      'Executive summary',
      'Funnel and rejection reasons',
      'Velocity and time in stage',
      'Source of hire',
      'Recruiter performance',
      'Interviews',
      'Offers',
      'By client',
      'Date range, job, client and recruiter filters',
      'CSV export',
    ],
    preview: [
      'Job health',
      'Cost per hire',
      'Quality of hire',
      'Hiring plan',
      'Diversity',
      'Candidate experience',
      'Trend charts and plan cards inside live reports',
    ],
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
  '/dashboard/settings/integrations': {
    level: 'integrated',
    live: [
      'Calendar and meetings, communication and hiring channel groups',
      'OAuth and API key connections with health check',
      'Email inbox mailboxes with sync and disconnect',
      'Job board feed status',
    ],
  },
  '/dashboard/settings/integrations/whatsapp': SETTINGS_LIVE,
  '/dashboard/settings/integrations/job-feed': SETTINGS_LIVE,
  '/dashboard/settings/availability': SETTINGS_LIVE,
  '/dashboard/settings/audit': SETTINGS_LIVE,
  '/dashboard/settings/email-templates': SETTINGS_LIVE,
  '/dashboard/settings/ats': SETTINGS_LIVE,
  '/dashboard/settings/pipeline': SETTINGS_LIVE,
  '/dashboard/settings/custom-fields': SETTINGS_LIVE,
};

export const SHOW_INTEGRATION_STATUS =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_SHOW_INTEGRATION_STATUS === 'true';
