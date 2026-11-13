import {
  CandidateSource,
  EmploymentType,
  RightToWork,
  WorkMode,
} from '@db/enums';

export const SAMPLE_SUFFIX = ' (sample)';

export interface SampleClient {
  name: string;
  industry: string;
  email: string;
  website: string;
  jobs: SampleJob[];
}

export interface SampleJob {
  title: string;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  description: string;
}

export interface SampleCandidate {
  firstName: string;
  lastName: string;
  email: string;
  currentTitle: string;
  location: string;
  skills: string[];
  source: CandidateSource;
  rightToWork: RightToWork;
  jobIndex: number;
  stageIndex: number;
}

export const SAMPLE_CLIENTS: SampleClient[] = [
  {
    name: 'Northwind Logistics',
    industry: 'Logistics',
    email: 'talent@northwind.example.com',
    website: 'https://northwind.example.com',
    jobs: [
      {
        title: 'Warehouse supervisor',
        location: 'Birmingham',
        employmentType: EmploymentType.PERMANENT,
        workMode: WorkMode.ONSITE,
        salaryMin: 32000,
        salaryMax: 38000,
        skills: ['Team leadership', 'Health and safety', 'WMS'],
        description:
          'Lead a shift team of 12 across goods in, picking and dispatch.',
      },
      {
        title: 'Transport planner',
        location: 'Coventry',
        employmentType: EmploymentType.CONTRACT,
        workMode: WorkMode.HYBRID,
        salaryMin: 30000,
        salaryMax: 34000,
        skills: ['Route planning', 'Excel', 'Tachograph rules'],
        description:
          'Plan daily routes for a fleet of 40 vehicles across the Midlands.',
      },
    ],
  },
  {
    name: 'Brightwater Health',
    industry: 'Healthcare',
    email: 'people@brightwater.example.com',
    website: 'https://brightwater.example.com',
    jobs: [
      {
        title: 'Staff nurse',
        location: 'Leeds',
        employmentType: EmploymentType.TEMPORARY,
        workMode: WorkMode.ONSITE,
        salaryMin: 29000,
        salaryMax: 36000,
        skills: ['NMC registration', 'Patient care', 'Medication rounds'],
        description: 'Ward based nursing on day and night rotation.',
      },
    ],
  },
];

export const SAMPLE_CANDIDATES: SampleCandidate[] = [
  {
    firstName: 'Amelia',
    lastName: 'Hughes',
    email: 'amelia.hughes.sample@example.com',
    currentTitle: 'Shift manager',
    location: 'Birmingham',
    skills: ['Team leadership', 'WMS'],
    source: CandidateSource.LINKEDIN,
    rightToWork: RightToWork.UK_CITIZEN,
    jobIndex: 0,
    stageIndex: 2,
  },
  {
    firstName: 'Oliver',
    lastName: 'Patel',
    email: 'oliver.patel.sample@example.com',
    currentTitle: 'Warehouse team leader',
    location: 'Wolverhampton',
    skills: ['Health and safety', 'Forklift'],
    source: CandidateSource.INDEED,
    rightToWork: RightToWork.SETTLED_STATUS,
    jobIndex: 0,
    stageIndex: 1,
  },
  {
    firstName: 'Grace',
    lastName: 'Okafor',
    email: 'grace.okafor.sample@example.com',
    currentTitle: 'Logistics coordinator',
    location: 'Coventry',
    skills: ['Route planning', 'Excel'],
    source: CandidateSource.REED,
    rightToWork: RightToWork.UK_CITIZEN,
    jobIndex: 1,
    stageIndex: 0,
  },
  {
    firstName: 'Harry',
    lastName: 'Lewis',
    email: 'harry.lewis.sample@example.com',
    currentTitle: 'Registered nurse',
    location: 'Leeds',
    skills: ['NMC registration', 'Patient care'],
    source: CandidateSource.REFERRAL,
    rightToWork: RightToWork.UK_CITIZEN,
    jobIndex: 2,
    stageIndex: 3,
  },
  {
    firstName: 'Sofia',
    lastName: 'Novak',
    email: 'sofia.novak.sample@example.com',
    currentTitle: 'Healthcare assistant',
    location: 'Bradford',
    skills: ['Patient care'],
    source: CandidateSource.CAREERS_PAGE,
    rightToWork: RightToWork.WORK_VISA,
    jobIndex: 2,
    stageIndex: 0,
  },
];
