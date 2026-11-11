import {
  ArrowRightLeft,
  CalendarClock,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FileSignature,
  Gauge,
  Hourglass,
  Inbox,
  ListTodo,
  Mail,
  MessageSquare,
  Tags,
  type LucideIcon,
} from 'lucide-react';

export type TriggerId =
  | 'application_received'
  | 'stage_changed'
  | 'interview_completed'
  | 'scorecard_overdue'
  | 'offer_accepted'
  | 'candidate_inactive'
  | 'schedule';

export type RoleId = 'sourcer' | 'screener' | 'coordinator' | 'ops';

export type ActionId =
  | 'score'
  | 'tag'
  | 'move_stage'
  | 'draft_email'
  | 'scheduling_link'
  | 'notify_slack'
  | 'create_task';

export type ApprovalMode = 'suggest' | 'approval' | 'auto';

export type Tone = 'warm' | 'neutral' | 'formal';

export interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface ActionStep {
  id: string;
  type: ActionId;
  config: string;
}

export interface AgentConfig {
  name: string;
  description: string;
  trigger: TriggerId;
  stage: string;
  inactiveDays: number;
  cadence: 'daily' | 'weekly';
  jobScope: 'all' | 'specific';
  jobs: string[];
  conditions: Condition[];
  role: RoleId;
  instructions: string;
  context: string[];
  tone: Tone;
  actions: ActionStep[];
  mode: ApprovalMode;
  hideIdentity: boolean;
  neverAutoReject: boolean;
  workingHoursOnly: boolean;
  dailyLimit: number;
}

export const TRIGGERS: {
  id: TriggerId;
  label: string;
  sentence: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'application_received',
    label: 'Application received',
    sentence: 'When an application is received',
    icon: Inbox,
  },
  {
    id: 'stage_changed',
    label: 'Candidate moved to stage',
    sentence: 'When a candidate moves to a stage',
    icon: ArrowRightLeft,
  },
  {
    id: 'interview_completed',
    label: 'Interview completed',
    sentence: 'When an interview is completed',
    icon: ClipboardCheck,
  },
  {
    id: 'scorecard_overdue',
    label: 'Scorecard overdue',
    sentence: 'When a scorecard is overdue',
    icon: Hourglass,
  },
  {
    id: 'offer_accepted',
    label: 'Offer accepted',
    sentence: 'When an offer is accepted',
    icon: FileSignature,
  },
  {
    id: 'candidate_inactive',
    label: 'Candidate inactive',
    sentence: 'When a candidate has no activity',
    icon: Gauge,
  },
  {
    id: 'schedule',
    label: 'On a schedule',
    sentence: 'On a recurring schedule',
    icon: CalendarRange,
  },
];

export const ROLES: {
  id: RoleId;
  label: string;
  summary: string;
  instructions: string;
}[] = [
  {
    id: 'screener',
    label: 'Screener',
    summary: 'Reviews applications against the role scorecard',
    instructions:
      'Review each application against the role scorecard. Score must-have criteria first, then nice-to-haves. Write a two line summary a recruiter can scan in five seconds. Flag anything unclear instead of guessing, and never use age, gender, photo or name as a signal.',
  },
  {
    id: 'sourcer',
    label: 'Sourcer',
    summary: 'Finds and re-engages promising talent',
    instructions:
      'Search past applicants and silver medalists who match this role. Prioritise people who reached onsite or later. Draft a short, personal note that references their previous conversation with us and why this role is a better fit.',
  },
  {
    id: 'coordinator',
    label: 'Coordinator',
    summary: 'Keeps interviews and feedback moving',
    instructions:
      'Keep the interview process moving. Find slots that work for the full panel within the next five working days, send the candidate a booking link and remind interviewers who have not submitted feedback within 24 hours.',
  },
  {
    id: 'ops',
    label: 'Recruiting ops',
    summary: 'Handles hand-offs and hygiene',
    instructions:
      'Handle the hand-off after an offer is accepted. Create onboarding tasks, notify the hiring manager and People team, and close out the candidate in any other open pipelines.',
  },
];

export const CONTEXT_SOURCES = [
  'Job description',
  'Role scorecard',
  'Hiring manager notes',
  'Company handbook',
  'Past interview feedback',
  'Candidate resume',
];

export const ACTIONS: Record<
  ActionId,
  {
    label: string;
    icon: LucideIcon;
    placeholder: string;
    defaultConfig: string;
  }
> = {
  score: {
    label: 'Score against scorecard',
    icon: ClipboardList,
    placeholder: 'Minimum score to advance',
    defaultConfig: '75',
  },
  tag: {
    label: 'Add tags',
    icon: Tags,
    placeholder: 'Tags, comma separated',
    defaultConfig: 'Strong match, Backend',
  },
  move_stage: {
    label: 'Move to stage',
    icon: ArrowRightLeft,
    placeholder: 'Stage',
    defaultConfig: 'Phone screen',
  },
  draft_email: {
    label: 'Draft email to candidate',
    icon: Mail,
    placeholder: 'Email template',
    defaultConfig: 'Next steps invitation',
  },
  scheduling_link: {
    label: 'Send scheduling link',
    icon: CalendarClock,
    placeholder: 'Interview type',
    defaultConfig: 'Recruiter screen, 30 min',
  },
  notify_slack: {
    label: 'Notify hiring manager on Slack',
    icon: MessageSquare,
    placeholder: 'Channel',
    defaultConfig: '#hiring-backend',
  },
  create_task: {
    label: 'Create task for recruiter',
    icon: ListTodo,
    placeholder: 'Task',
    defaultConfig: 'Review agent shortlist',
  },
};

export const STAGES = [
  'Applied',
  'Screening',
  'Phone screen',
  'Technical',
  'Onsite',
  'Offer',
  'Hired',
];

export const JOBS = [
  'Senior Backend Engineer',
  'Frontend Engineer',
  'Product Designer',
  'Data Analyst',
  'DevOps Engineer',
  'Product Manager, Growth',
];

export const CONDITION_FIELDS = [
  'Source',
  'Location',
  'Department',
  'Years of experience',
  'Tag',
];
export const CONDITION_OPERATORS = ['is', 'is not', 'contains', 'at least'];

export const APPROVAL_LABEL: Record<ApprovalMode, string> = {
  suggest: 'Suggest only',
  approval: 'Auto with approval',
  auto: 'Fully automatic',
};

export const APPROVAL_DESCRIPTION: Record<ApprovalMode, string> = {
  suggest: 'The agent drafts every action and a recruiter applies it',
  approval:
    'Low-risk actions run automatically, anything candidate-facing waits for approval',
  auto: 'All actions run immediately within the guardrails below',
};

let counter = 0;
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const step = (type: ActionId, config?: string): ActionStep => ({
  id: uid('a'),
  type,
  config: config ?? ACTIONS[type].defaultConfig,
});

const roleInstructions = (role: RoleId) =>
  ROLES.find((r) => r.id === role)?.instructions ?? '';

const base: AgentConfig = {
  name: 'Untitled agent',
  description: '',
  trigger: 'application_received',
  stage: 'Onsite',
  inactiveDays: 14,
  cadence: 'weekly',
  jobScope: 'all',
  jobs: [],
  conditions: [],
  role: 'screener',
  instructions: roleInstructions('screener'),
  context: ['Job description', 'Role scorecard', 'Candidate resume'],
  tone: 'warm',
  actions: [step('score'), step('tag'), step('create_task')],
  mode: 'approval',
  hideIdentity: true,
  neverAutoReject: true,
  workingHoursOnly: true,
  dailyLimit: 200,
};

export const TEMPLATES: Record<
  string,
  { title: string; description: string; build: () => AgentConfig }
> = {
  screen: {
    title: 'Screen inbound applicants',
    description: 'Score every new application and shortlist the strongest',
    build: () => ({
      ...base,
      name: 'Inbound screener, Engineering',
      description:
        'Scores inbound engineering applications and drafts a daily shortlist',
      trigger: 'application_received',
      jobScope: 'specific',
      jobs: ['Senior Backend Engineer', 'Frontend Engineer', 'DevOps Engineer'],
      conditions: [
        { id: uid('c'), field: 'Source', operator: 'is not', value: 'Agency' },
      ],
      role: 'screener',
      instructions: roleInstructions('screener'),
      actions: [
        step('score', '75'),
        step('tag'),
        step('move_stage', 'Phone screen'),
        step('draft_email'),
        step('notify_slack'),
      ],
    }),
  },
  scorecards: {
    title: 'Chase overdue scorecards',
    description: 'Nudge interviewers and keep feedback under 24 hours',
    build: () => ({
      ...base,
      name: 'Scorecard chaser',
      description:
        'Reminds interviewers and escalates feedback that is more than a day late',
      trigger: 'scorecard_overdue',
      role: 'coordinator',
      instructions: roleInstructions('coordinator'),
      context: ['Past interview feedback', 'Hiring manager notes'],
      tone: 'neutral',
      actions: [
        step('notify_slack', '#interviewers'),
        step('create_task', 'Escalate overdue feedback'),
      ],
      mode: 'auto',
    }),
  },
  rediscover: {
    title: 'Re-engage silver medalists',
    description: 'Surface past finalists when a similar role opens',
    build: () => ({
      ...base,
      name: 'Silver medalist rediscovery',
      description:
        'Finds past finalists for newly opened roles and drafts outreach',
      trigger: 'schedule',
      cadence: 'weekly',
      role: 'sourcer',
      instructions: roleInstructions('sourcer'),
      context: [
        'Job description',
        'Past interview feedback',
        'Candidate resume',
      ],
      conditions: [
        {
          id: uid('c'),
          field: 'Tag',
          operator: 'is',
          value: 'Silver medalist',
        },
      ],
      actions: [
        step('score', '70'),
        step('draft_email', 'Re-engagement note'),
        step('create_task', 'Review rediscovered profiles'),
      ],
      mode: 'suggest',
    }),
  },
};

export function buildInitialConfig(template: string | null): AgentConfig {
  if (template && TEMPLATES[template]) return TEMPLATES[template].build();
  return {
    ...base,
    actions: base.actions.map((a) => ({ ...a, id: uid('a') })),
  };
}

export function roleInstructionsFor(role: RoleId) {
  return roleInstructions(role);
}

export function triggerSentence(config: AgentConfig): string {
  const t = TRIGGERS.find((x) => x.id === config.trigger);
  if (config.trigger === 'stage_changed')
    return `When a candidate moves to ${config.stage}`;
  if (config.trigger === 'candidate_inactive')
    return `When a candidate is inactive for ${config.inactiveDays} days`;
  if (config.trigger === 'schedule')
    return config.cadence === 'daily'
      ? 'Every weekday at 09:00'
      : 'Every Monday at 09:00';
  return t?.sentence ?? '';
}
