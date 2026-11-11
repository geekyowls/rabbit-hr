import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource, DeepPartial } from 'typeorm';
import {
  ActivityEntity,
  ApplicationEntity,
  CandidateDocumentEntity,
  CandidateEntity,
  ClientContactEntity,
  ClientEntity,
  EmailTemplateEntity,
  JobEntity,
  TaskEntity,
  UserEntity,
} from '../src/database/entities';
import {
  ActivityType,
  APPLICATION_STAGE_ORDER,
  ApplicationStage,
  CandidateSource,
  ClientStatus,
  DocumentType,
  DocumentVerificationStatus,
  EmailTemplateCategory,
  EmploymentType,
  JobStatus,
  RateUnit,
  RightToWork,
  TaskStatus,
  UserStatus,
  WorkMode,
} from '../src/database/enums';

export interface SeedAtsContext {
  organizationId: string;
  adminUserId: string;
  adminRoleId: string;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261111);
const int = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)];
const chance = (p: number) => rand() < p;
const pickMany = <T>(items: readonly T[], count: number): T[] => {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
};

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const daysAgo = (days: number) =>
  new Date(NOW - days * DAY - int(0, 8 * 3600) * 1000);
const between = (from: Date, to: Date) =>
  new Date(
    from.getTime() + rand() * Math.max(0, to.getTime() - from.getTime()),
  );
const toDateString = (date: Date) => date.toISOString().slice(0, 10);
const phone = () => `+44 7${int(100, 999)} ${int(100000, 999999)}`;

const RECRUITERS = [
  {
    firstName: 'Hannah',
    lastName: 'Whitfield',
    email: 'hannah.whitfield@rabbithr.test',
  },
  {
    firstName: 'Marcus',
    lastName: 'Okafor',
    email: 'marcus.okafor@rabbithr.test',
  },
  {
    firstName: 'Priya',
    lastName: 'Chauhan',
    email: 'priya.chauhan@rabbithr.test',
  },
];

interface ClientSeed {
  name: string;
  legalName: string;
  industry: string;
  website: string;
  brandColor: string;
  street: string;
  city: string;
  county: string;
  postcode: string;
  paymentTerms: string;
  roles: JobSeed[];
}

interface JobSeed {
  title: string;
  type: EmploymentType;
  workMode: WorkMode;
  location: string;
  skills: string[];
  documents: DocumentType[];
  salary?: [number, number];
  pay?: [number, number];
  day?: [number, number];
  status?: JobStatus;
}

const CLIENTS: ClientSeed[] = [
  {
    name: 'Meadowbrook Care Homes',
    legalName: 'Meadowbrook Care Homes Ltd',
    industry: 'Social care',
    website: 'https://meadowbrookcare.example.co.uk',
    brandColor: '#3F6650',
    street: '14 Wellington Road',
    city: 'Leeds',
    county: 'West Yorkshire',
    postcode: 'LS12 1DR',
    paymentTerms: '30 days',
    roles: [
      {
        title: 'Senior Care Assistant',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.ONSITE,
        location: 'Leeds',
        skills: [
          'Personal care',
          'Medication administration',
          'Dementia care',
          'Care planning',
        ],
        documents: [
          DocumentType.CV,
          DocumentType.RIGHT_TO_WORK,
          DocumentType.DBS,
        ],
        salary: [25500, 28000],
      },
      {
        title: 'Night Care Assistant',
        type: EmploymentType.TEMPORARY,
        workMode: WorkMode.ONSITE,
        location: 'Harrogate',
        skills: ['Personal care', 'Moving and handling', 'Safeguarding'],
        documents: [
          DocumentType.CV,
          DocumentType.RIGHT_TO_WORK,
          DocumentType.DBS,
        ],
        pay: [13.2, 18.5],
      },
      {
        title: 'Registered Nurse (RGN)',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.ONSITE,
        location: 'Wakefield',
        skills: [
          'NMC registration',
          'Clinical assessment',
          'Wound care',
          'Medication administration',
        ],
        documents: [
          DocumentType.CV,
          DocumentType.RIGHT_TO_WORK,
          DocumentType.DBS,
          DocumentType.CERTIFICATE,
        ],
        salary: [38000, 43000],
      },
    ],
  },
  {
    name: 'Northline Logistics',
    legalName: 'Northline Logistics Group plc',
    industry: 'Logistics and warehousing',
    website: 'https://northline.example.co.uk',
    brandColor: '#1F4E79',
    street: 'Unit 7, Trafford Park Way',
    city: 'Manchester',
    county: 'Greater Manchester',
    postcode: 'M17 1HH',
    paymentTerms: '45 days',
    roles: [
      {
        title: 'Warehouse Operative',
        type: EmploymentType.TEMPORARY,
        workMode: WorkMode.ONSITE,
        location: 'Manchester',
        skills: ['Picking and packing', 'RF scanners', 'Counterbalance FLT'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        pay: [12.6, 16.9],
      },
      {
        title: 'HGV Class 1 Driver',
        type: EmploymentType.TEMPORARY,
        workMode: WorkMode.ONSITE,
        location: 'Warrington',
        skills: ['CPC', 'Tachograph', 'Digital tacho card', 'Multi drop'],
        documents: [
          DocumentType.CV,
          DocumentType.RIGHT_TO_WORK,
          DocumentType.ID,
        ],
        pay: [18.5, 24.75],
      },
      {
        title: 'Transport Planner',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.HYBRID,
        location: 'Manchester',
        skills: [
          'Route planning',
          'Paragon',
          'Excel',
          'Stakeholder management',
        ],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        salary: [32000, 36000],
      },
    ],
  },
  {
    name: 'Ironbridge Construction',
    legalName: 'Ironbridge Construction Ltd',
    industry: 'Construction',
    website: 'https://ironbridge.example.co.uk',
    brandColor: '#B5651D',
    street: '88 Colmore Row',
    city: 'Birmingham',
    county: 'West Midlands',
    postcode: 'B3 2BB',
    paymentTerms: '30 days',
    roles: [
      {
        title: 'Site Manager',
        type: EmploymentType.CONTRACT,
        workMode: WorkMode.ONSITE,
        location: 'Birmingham',
        skills: [
          'SMSTS',
          'CSCS Black Card',
          'First aid',
          'Programme management',
        ],
        documents: [
          DocumentType.CV,
          DocumentType.RIGHT_TO_WORK,
          DocumentType.CERTIFICATE,
        ],
        day: [320, 420],
      },
      {
        title: 'Quantity Surveyor',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.HYBRID,
        location: 'Coventry',
        skills: ['NEC contracts', 'Cost planning', 'Valuations', 'CostX'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        salary: [48000, 58000],
      },
      {
        title: 'Groundworker',
        type: EmploymentType.TEMPORARY,
        workMode: WorkMode.ONSITE,
        location: 'Wolverhampton',
        skills: ['CSCS Green Card', 'Drainage', 'Kerbing', 'Excavation'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        pay: [16, 21.5],
        status: JobStatus.FILLED,
      },
    ],
  },
  {
    name: 'The Harbourside Hotel Collection',
    legalName: 'Harbourside Hospitality Ltd',
    industry: 'Hospitality',
    website: 'https://harbourside.example.co.uk',
    brandColor: '#0E7C86',
    street: '2 Canons Way',
    city: 'Bristol',
    county: 'Bristol',
    postcode: 'BS1 5LL',
    paymentTerms: '14 days',
    roles: [
      {
        title: 'Chef de Partie',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.ONSITE,
        location: 'Bristol',
        skills: ['Food hygiene Level 3', 'Fine dining', 'Menu development'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        salary: [29000, 32000],
      },
      {
        title: 'Events Waiting Staff',
        type: EmploymentType.TEMPORARY,
        workMode: WorkMode.ONSITE,
        location: 'Bath',
        skills: ['Silver service', 'Customer service', 'Bar work'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        pay: [12.21, 15.75],
      },
    ],
  },
  {
    name: 'Albion Medical Supplies',
    legalName: 'Albion Medical Supplies Ltd',
    industry: 'NHS supply chain',
    website: 'https://albionmedical.example.co.uk',
    brandColor: '#005EB8',
    street: '41 Mill Lane',
    city: 'Nottingham',
    county: 'Nottinghamshire',
    postcode: 'NG2 3BU',
    paymentTerms: '30 days',
    roles: [
      {
        title: 'Field Service Engineer',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.HYBRID,
        location: 'Nottingham',
        skills: [
          'Medical devices',
          'Electronics',
          'Full UK driving licence',
          'Fault finding',
        ],
        documents: [
          DocumentType.CV,
          DocumentType.RIGHT_TO_WORK,
          DocumentType.DBS,
        ],
        salary: [34000, 39000],
      },
      {
        title: 'Procurement Officer',
        type: EmploymentType.CONTRACT,
        workMode: WorkMode.HYBRID,
        location: 'Derby',
        skills: ['NHS frameworks', 'Supplier management', 'SAP', 'Tendering'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        day: [250, 300],
        status: JobStatus.ON_HOLD,
      },
    ],
  },
  {
    name: 'Sterling Ward Financial',
    legalName: 'Sterling Ward Financial Services LLP',
    industry: 'Financial services',
    website: 'https://sterlingward.example.co.uk',
    brandColor: '#2B2D42',
    street: '25 Bishopsgate',
    city: 'London',
    county: 'Greater London',
    postcode: 'EC2N 3AS',
    paymentTerms: '30 days',
    roles: [
      {
        title: 'Management Accountant',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.HYBRID,
        location: 'London',
        skills: ['CIMA', 'Month end', 'Variance analysis', 'Xero'],
        documents: [
          DocumentType.CV,
          DocumentType.RIGHT_TO_WORK,
          DocumentType.REFERENCE,
        ],
        salary: [52000, 60000],
      },
      {
        title: 'Compliance Analyst',
        type: EmploymentType.CONTRACT,
        workMode: WorkMode.HYBRID,
        location: 'London',
        skills: ['FCA regulation', 'KYC', 'AML', 'Consumer Duty'],
        documents: [
          DocumentType.CV,
          DocumentType.RIGHT_TO_WORK,
          DocumentType.REFERENCE,
        ],
        day: [450, 550],
      },
      {
        title: 'Payroll Administrator',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.ONSITE,
        location: 'Reading',
        skills: ['Sage Payroll', 'PAYE', 'Pensions auto enrolment'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        salary: [27000, 30000],
        status: JobStatus.DRAFT,
      },
    ],
  },
  {
    name: 'Hartley & Rowe Retail',
    legalName: 'Hartley and Rowe Retail Ltd',
    industry: 'Retail',
    website: 'https://hartleyrowe.example.co.uk',
    brandColor: '#C2185B',
    street: '120 Princes Street',
    city: 'Edinburgh',
    county: 'City of Edinburgh',
    postcode: 'EH2 4AD',
    paymentTerms: '30 days',
    roles: [
      {
        title: 'Store Manager',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.ONSITE,
        location: 'Edinburgh',
        skills: [
          'P and L',
          'Visual merchandising',
          'Team leadership',
          'Stock control',
        ],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        salary: [36000, 40000],
      },
      {
        title: 'Seasonal Retail Assistant',
        type: EmploymentType.TEMPORARY,
        workMode: WorkMode.ONSITE,
        location: 'Glasgow',
        skills: ['Customer service', 'Tills', 'Stock replenishment'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        pay: [12.21, 15.4],
      },
    ],
  },
  {
    name: 'Brightwave Technologies',
    legalName: 'Brightwave Technologies Ltd',
    industry: 'Technology',
    website: 'https://brightwave.example.co.uk',
    brandColor: '#6C4AB6',
    street: '9 Hills Road',
    city: 'Cambridge',
    county: 'Cambridgeshire',
    postcode: 'CB2 1NL',
    paymentTerms: '30 days',
    roles: [
      {
        title: 'Senior Backend Engineer',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.REMOTE,
        location: 'Remote, UK',
        skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        salary: [70000, 85000],
      },
      {
        title: 'IT Support Analyst',
        type: EmploymentType.CONTRACT,
        workMode: WorkMode.HYBRID,
        location: 'Cambridge',
        skills: ['Microsoft 365', 'Intune', 'ITIL', '1st line support'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        day: [180, 220],
      },
      {
        title: 'Product Designer',
        type: EmploymentType.PERMANENT,
        workMode: WorkMode.HYBRID,
        location: 'London',
        skills: ['Figma', 'User research', 'Design systems', 'Prototyping'],
        documents: [DocumentType.CV, DocumentType.RIGHT_TO_WORK],
        salary: [55000, 65000],
        status: JobStatus.CLOSED,
      },
    ],
  },
];

const CONTACT_TITLES = [
  'HR Manager',
  'Operations Director',
  'Talent Acquisition Lead',
  'Hiring Manager',
  'Finance Director',
  'Head of People',
];

const FIRST_NAMES = [
  'Oliver',
  'Amelia',
  'Jack',
  'Isla',
  'Harry',
  'Ava',
  'George',
  'Emily',
  'Noah',
  'Sophie',
  'Mohammed',
  'Aisha',
  'Ravi',
  'Ananya',
  'Kwame',
  'Chiamaka',
  'Liam',
  'Grace',
  'Callum',
  'Eilidh',
  'Rhys',
  'Seren',
  'Dylan',
  'Ffion',
  'Tomasz',
  'Zofia',
  'Mateusz',
  'Ioana',
  'Andrei',
  'Fatima',
  'Yusuf',
  'Hassan',
  'Mei',
  'Wei',
  'Daniel',
  'Chloe',
  'Samuel',
  'Jessica',
  'Ethan',
  'Lucy',
  'Arjun',
  'Simran',
  'Kofi',
  'Adaeze',
  'Connor',
  'Niamh',
  'Ciaran',
  'Aoife',
  'Jamal',
  'Leah',
  'Bilal',
  'Zara',
  'Thomas',
  'Charlotte',
  'William',
  'Poppy',
  'Hamza',
  'Maryam',
  'Luca',
  'Elena',
];
const LAST_NAMES = [
  'Smith',
  'Jones',
  'Taylor',
  'Brown',
  'Williams',
  'Wilson',
  'Johnson',
  'Davies',
  'Patel',
  'Khan',
  'Ahmed',
  'Singh',
  'Begum',
  'Evans',
  'Thomas',
  'Roberts',
  'Walker',
  'Wright',
  'Robinson',
  'Thompson',
  'Hughes',
  'Edwards',
  'Green',
  'Hall',
  'Wood',
  'Clarke',
  'Mensah',
  'Okoye',
  'Adeyemi',
  'Nowak',
  'Kowalski',
  'Popescu',
  'Chen',
  'Wong',
  'Murphy',
  "O'Brien",
  'Campbell',
  'Stewart',
  'MacDonald',
  'Hussain',
  'Ali',
  'Shah',
  'Morgan',
  'Price',
  'Lewis',
  'Mitchell',
];
const CITIES = [
  'London',
  'Manchester',
  'Birmingham',
  'Leeds',
  'Bristol',
  'Liverpool',
  'Sheffield',
  'Nottingham',
  'Leicester',
  'Newcastle upon Tyne',
  'Glasgow',
  'Edinburgh',
  'Cardiff',
  'Belfast',
  'Coventry',
  'Bradford',
  'Reading',
  'Cambridge',
  'Brighton',
  'Southampton',
  'Wakefield',
  'Warrington',
  'Derby',
  'Bath',
];
const EMPLOYERS = [
  'Tesco',
  "Sainsbury's",
  'Amazon UK',
  'DHL Supply Chain',
  'Barchester Healthcare',
  'HC-One',
  'Balfour Beatty',
  'Kier Group',
  'Whitbread',
  'Premier Inn',
  'Lloyds Banking Group',
  'Aviva',
  'NHS Supply Chain',
  'Boots',
  'John Lewis Partnership',
  'BT Group',
  'Sky',
  'Capita',
  'Serco',
  'Wincanton',
  'Morrisons',
  'Marks and Spencer',
  'Self employed',
];
const TAGS = [
  'Immediate start',
  'Night shifts',
  'Own transport',
  'Relocating',
  'Silver medallist',
  'Contract to perm',
  'Weekend availability',
  'Bilingual',
  'Graduate',
  'Senior',
  'Shortlist ready',
  'Do not contact before 5pm',
];
const NOTICE_PERIODS = [
  'Immediate',
  '1 week',
  '2 weeks',
  '1 month',
  '2 months',
  '3 months',
];
const SOURCES = Object.values(CandidateSource);
const RIGHT_TO_WORK = [
  RightToWork.UK_CITIZEN,
  RightToWork.UK_CITIZEN,
  RightToWork.UK_CITIZEN,
  RightToWork.SETTLED_STATUS,
  RightToWork.SETTLED_STATUS,
  RightToWork.WORK_VISA,
  RightToWork.VISA_SPONSORSHIP_REQUIRED,
  RightToWork.UNKNOWN,
];

const REJECTION_REASONS = [
  'Insufficient relevant experience for the role',
  'Salary expectations above the client budget',
  'Client has progressed with a stronger candidate',
  'Unable to provide right to work documentation',
  'Location and commute not suitable',
  'Did not attend the interview',
  'Notice period too long for the client start date',
  'Failed the skills assessment',
  'References could not be verified',
  'Client feedback: not the right cultural fit',
];

const NOTES = [
  'Spoke to the candidate, keen on the role and available for interview next week.',
  'Candidate prefers early shifts due to childcare. Flagged with the client.',
  'Strong CV, previous experience in a very similar setting. Recommend fast tracking.',
  'Left a voicemail, will try again tomorrow morning.',
  'Candidate has a competing offer, needs a decision by Friday.',
  'Right to work checked in person, share code verified on GOV.UK.',
  'Client asked for two more profiles similar to this one.',
  'Candidate is happy with the rate and can start on Monday.',
  'Discussed salary expectations, open to negotiation within the band.',
  'Reference from previous manager was very positive.',
  'Candidate asked about flexible working, client is open to four days on site.',
  'Interview feedback was positive, client wants a second stage.',
  'Needs to renew their DBS, application submitted via the update service.',
  'Candidate relocating from Scotland in the new year, keep warm.',
  'Agreed to put forward for the weekend rota as well.',
];

const CALL_TITLES = [
  'Screening call',
  'Catch up call',
  'Interview prep call',
  'Offer discussion',
  'Reference call',
];
const EMAIL_SUBJECTS = [
  'Interview confirmation',
  'Application update',
  'Documents requested',
  'Thank you for applying',
  'Offer details',
];

const TASK_TITLES = [
  'Chase right to work documents',
  'Book second interview with the client',
  'Send interview feedback to candidate',
  'Request references',
  'Confirm start date and induction',
  'Update client on shortlist',
  'Check DBS certificate',
  'Prepare offer letter',
  'Call candidate re availability',
  'Collect timesheets for the week',
  'Review new applications',
  'Arrange site visit',
];

function jobDescription(seed: JobSeed, client: ClientSeed): string {
  return `We are recruiting a ${seed.title} on behalf of ${client.name}, a respected ${client.industry.toLowerCase()} organisation based in ${seed.location}. This is a ${seed.type} opportunity working ${seed.workMode === WorkMode.ONSITE ? 'on site' : seed.workMode}.\n\nYou will join a friendly, well organised team and play a key part in delivering a high quality service. Our client offers ongoing training, a clear route for progression and a supportive working culture.`;
}

function jobRequirements(seed: JobSeed): string {
  return [
    `Proven experience as a ${seed.title} or in a similar role`,
    ...seed.skills.map((s) => `Knowledge of ${s}`),
    'Excellent communication skills and a positive attitude',
    'Right to work in the UK',
  ]
    .map((line) => `- ${line}`)
    .join('\n');
}

const STAGE_WEIGHTS: Array<[ApplicationStage, number]> = [
  [ApplicationStage.APPLIED, 60],
  [ApplicationStage.SCREENING, 42],
  [ApplicationStage.INTERVIEW, 28],
  [ApplicationStage.OFFER, 12],
  [ApplicationStage.PLACED, 14],
  [ApplicationStage.REJECTED, 34],
  [ApplicationStage.WITHDRAWN, 10],
];

const FUNNEL = [
  ApplicationStage.APPLIED,
  ApplicationStage.SCREENING,
  ApplicationStage.INTERVIEW,
  ApplicationStage.OFFER,
  ApplicationStage.PLACED,
];

const EMAIL_TEMPLATES: Array<DeepPartial<EmailTemplateEntity>> = [
  {
    name: 'Invitation to apply',
    category: EmailTemplateCategory.INVITE,
    subject: 'An opportunity that suits you: {{job.title}}',
    body: 'Hi {{candidate.firstName}},\n\nI hope you are well. I came across your profile and think you would be a great fit for a {{job.title}} role we are recruiting for with {{client.name}}.\n\nIf you would like to hear more, simply reply to this email or give me a call and I will talk you through the details.\n\nKind regards,\n{{recruiter.name}}\n{{organization.name}}',
  },
  {
    name: 'Interview invitation',
    category: EmailTemplateCategory.INTERVIEW,
    subject: 'Interview invitation: {{job.title}} with {{client.name}}',
    body: 'Hi {{candidate.firstName}},\n\nGood news! {{client.name}} would like to invite you to interview for the {{job.title}} position.\n\nPlease let me know your availability over the next few days and I will confirm a time that works for everyone. Do bring photo ID and proof of your right to work in the UK.\n\nBest of luck,\n{{recruiter.name}}\n{{organization.name}}',
  },
  {
    name: 'Offer of employment',
    category: EmailTemplateCategory.OFFER,
    subject: 'Congratulations, you have an offer for {{job.title}}',
    body: 'Hi {{candidate.firstName}},\n\nI am delighted to let you know that {{client.name}} would like to offer you the {{job.title}} role.\n\nI will call you shortly to go through the package, start date and next steps, including the pre employment checks.\n\nWell done and congratulations,\n{{recruiter.name}}\n{{organization.name}}',
  },
  {
    name: 'Unsuccessful application',
    category: EmailTemplateCategory.REJECTION,
    subject: 'Your application for {{job.title}}',
    body: 'Hi {{candidate.firstName}},\n\nThank you for your interest in the {{job.title}} role. After careful consideration, we will not be progressing your application on this occasion.\n\nWe would like to keep your details on file and will be in touch if a suitable opportunity comes up.\n\nKind regards,\n{{recruiter.name}}\n{{organization.name}}',
  },
  {
    name: 'Application received',
    category: EmailTemplateCategory.GENERAL,
    subject: 'Thanks for applying: {{job.title}}',
    body: 'Hi {{candidate.firstName}},\n\nThank you for applying for the {{job.title}} role. We have received your application and a member of the team will review it shortly.\n\nIf your experience matches what our client is looking for, we will be in touch within five working days.\n\nKind regards,\n{{recruiter.name}}\n{{organization.name}}',
  },
  {
    name: 'Documents request',
    category: EmailTemplateCategory.GENERAL,
    subject: 'Documents needed for your {{job.title}} application',
    body: 'Hi {{candidate.firstName}},\n\nTo keep your application for {{job.title}} moving, please send over the following at your earliest convenience:\n\n- Proof of your right to work in the UK (passport or share code)\n- Photo ID\n- Details of two referees\n\nThank you,\n{{recruiter.name}}\n{{organization.name}}',
  },
];

export async function seedAts(
  dataSource: DataSource,
  context: SeedAtsContext,
): Promise<void> {
  const { organizationId, adminUserId, adminRoleId } = context;
  const userRepo = dataSource.getRepository(UserEntity);
  const clientRepo = dataSource.getRepository(ClientEntity);
  const contactRepo = dataSource.getRepository(ClientContactEntity);
  const jobRepo = dataSource.getRepository(JobEntity);
  const candidateRepo = dataSource.getRepository(CandidateEntity);
  const applicationRepo = dataSource.getRepository(ApplicationEntity);
  const activityRepo = dataSource.getRepository(ActivityEntity);
  const taskRepo = dataSource.getRepository(TaskEntity);
  const documentRepo = dataSource.getRepository(CandidateDocumentEntity);
  const templateRepo = dataSource.getRepository(EmailTemplateEntity);

  const password = await bcrypt.hash('Admin@123', 10);
  const recruiterIds: string[] = [];
  for (const recruiter of RECRUITERS) {
    const existing = await userRepo.findOne({
      where: { email: recruiter.email, organizationId },
    });
    if (existing) {
      recruiterIds.push(existing.id);
      continue;
    }
    const created = await userRepo.save(
      userRepo.create({
        ...recruiter,
        password,
        organizationId,
        roleId: adminRoleId,
        status: UserStatus.ACTIVE,
        isActive: true,
        phoneCountryCode: 'GB',
      }),
    );
    recruiterIds.push(created.id);
    console.log(`Created recruiter: ${recruiter.email} / Admin@123`);
  }

  const existingCandidates = await candidateRepo.count({
    where: { organizationId },
  });
  if (existingCandidates > 0) {
    console.log(
      'ATS data already exists for this organization. Skipping ATS seed.',
    );
    return;
  }

  const team = [adminUserId, ...recruiterIds];

  const clients = await clientRepo.save(
    CLIENTS.map((c) =>
      clientRepo.create({
        organizationId,
        name: c.name,
        legalName: c.legalName,
        industry: c.industry,
        website: c.website,
        phone: `+44 ${int(113, 191)} ${int(100, 999)} ${int(1000, 9999)}`,
        email: `hello@${new URL(c.website).hostname}`,
        address: {
          street: c.street,
          city: c.city,
          county: c.county,
          postcode: c.postcode,
          country: 'United Kingdom',
        },
        billing: {
          contactName: 'Accounts Payable',
          email: `accounts@${new URL(c.website).hostname}`,
          phone: `+44 ${int(113, 191)} ${int(100, 999)} ${int(1000, 9999)}`,
          paymentTerms: c.paymentTerms,
          currency: 'GBP',
        },
        brandColor: c.brandColor,
        status: ClientStatus.ACTIVE,
        notes: `Preferred supplier agreement in place. Key account managed from our ${c.city} desk.`,
        ownerId: pick(recruiterIds),
      }),
    ),
  );

  const contacts: Array<DeepPartial<ClientContactEntity>> = [];
  clients.forEach((client, index) => {
    const count = int(2, 3);
    const host = new URL(CLIENTS[index].website).hostname;
    for (let i = 0; i < count; i++) {
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      contacts.push({
        organizationId,
        clientId: client.id,
        firstName,
        lastName,
        email:
          `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '') +
          `@${host}`,
        phone: phone(),
        jobTitle: CONTACT_TITLES[(index + i) % CONTACT_TITLES.length],
        isPrimary: i === 0,
      });
    }
  });
  await contactRepo.save(
    contacts.map((c) => contactRepo.create(c)),
    { chunk: 50 },
  );

  const jobRows: Array<DeepPartial<JobEntity>> = [];
  let jobNumber = 0;
  CLIENTS.forEach((clientSeed, index) => {
    for (const role of clientSeed.roles) {
      jobNumber++;
      const status = role.status ?? JobStatus.PUBLISHED;
      const createdAt = daysAgo(int(45, 80));
      const base: DeepPartial<JobEntity> = {
        organizationId,
        reference: `JOB-${String(jobNumber).padStart(4, '0')}`,
        clientId: clients[index].id,
        title: role.title,
        description: jobDescription(role, clientSeed),
        requirements: jobRequirements(role),
        employmentType: role.type,
        workMode: role.workMode,
        location: role.location,
        currency: 'GBP',
        openings: role.type === EmploymentType.TEMPORARY ? int(2, 6) : 1,
        status,
        ownerId: pick(team),
        closingDate: chance(0.6)
          ? toDateString(new Date(NOW + int(7, 45) * DAY))
          : null,
        publishedAt:
          status === JobStatus.DRAFT ? null : between(createdAt, daysAgo(40)),
        skills: role.skills,
        screeningQuestions: [
          {
            id: randomUUID(),
            question: 'Do you have the right to work in the UK?',
            required: true,
          },
          {
            id: randomUUID(),
            question: `How many years of experience do you have as a ${role.title}?`,
            required: true,
          },
          {
            id: randomUUID(),
            question: 'What is your earliest start date?',
            required: false,
          },
        ],
        requiredDocuments: role.documents,
        createdAt,
      };
      if (role.salary) {
        base.salaryMin = role.salary[0];
        base.salaryMax = role.salary[1];
        base.rateUnit = RateUnit.YEAR;
      } else if (role.pay) {
        base.payRate = role.pay[0];
        base.chargeRate = role.pay[1];
        base.rateUnit = RateUnit.HOUR;
      } else if (role.day) {
        base.payRate = role.day[0];
        base.chargeRate = role.day[1];
        base.rateUnit = RateUnit.DAY;
      }
      jobRows.push(base);
    }
  });
  const jobs = await jobRepo.save(
    jobRows.map((j) => jobRepo.create(j)),
    { chunk: 50 },
  );
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const usedEmails = new Set<string>();
  const candidateRows: Array<DeepPartial<CandidateEntity>> = [];
  for (let i = 0; i < 120; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const role = pick(CLIENTS.flatMap((c) => c.roles));
    let email =
      `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '') +
      `${i + 1}@example.com`;
    while (usedEmails.has(email)) email = `x${email}`;
    usedEmails.add(email);
    const years = int(0, 22);
    const createdAt = daysAgo(int(0, 90));
    const expected = role.salary
      ? Math.round(int(role.salary[0], role.salary[1]) / 500) * 500
      : null;
    candidateRows.push({
      organizationId,
      firstName,
      lastName,
      email,
      phone: phone(),
      location: pick(CITIES),
      headline: `${role.title} with ${years} years of experience`,
      currentTitle: role.title,
      currentEmployer: pick(EMPLOYERS),
      yearsExperience: years,
      skills: pickMany(role.skills, int(2, role.skills.length)),
      tags: chance(0.6) ? pickMany(TAGS, int(1, 3)) : [],
      source: SOURCES[i % SOURCES.length],
      linkedinUrl: chance(0.5)
        ? `https://www.linkedin.com/in/${firstName}-${lastName}-${i + 1}`
            .toLowerCase()
            .replace(/[^a-z0-9:/.-]/g, '')
        : null,
      expectedSalary: expected,
      noticePeriod: pick(NOTICE_PERIODS),
      rightToWork: pick(RIGHT_TO_WORK),
      gdprConsentAt: createdAt,
      ownerId: pick(team),
      rating: chance(0.6) ? int(1, 5) : null,
      cvFileKey: chance(0.7) ? `seed/${randomUUID()}.pdf` : null,
      createdAt,
    });
  }
  candidateRows.forEach((c) => {
    if (c.cvFileKey)
      c.cvFileName = `${c.firstName}-${c.lastName}-CV.pdf`.replace(
        /[^A-Za-z0-9.-]/g,
        '',
      );
  });
  const candidates = await candidateRepo.save(
    candidateRows.map((c) => candidateRepo.create(c)),
    { chunk: 50 },
  );

  const openJobs = jobs.filter((j) => j.status !== JobStatus.DRAFT);
  const stagePool: ApplicationStage[] = STAGE_WEIGHTS.flatMap(
    ([stage, weight]) => Array<ApplicationStage>(weight).fill(stage),
  );
  const pairs = new Set<string>();
  const applicationRows: Array<DeepPartial<ApplicationEntity>> = [];
  const startOfMonth = new Date(
    new Date(NOW).getFullYear(),
    new Date(NOW).getMonth(),
    1,
  );
  let placedThisMonth = 0;
  for (let i = 0; i < stagePool.length; i++) {
    const stage = stagePool[i];
    let candidate = pick(candidates);
    let job = pick(openJobs);
    let guard = 0;
    while (pairs.has(`${candidate.id}:${job.id}`) && guard++ < 50) {
      candidate = pick(candidates);
      job = pick(openJobs);
    }
    if (pairs.has(`${candidate.id}:${job.id}`)) continue;
    pairs.add(`${candidate.id}:${job.id}`);

    const appliedAt = daysAgo(
      int(stage === ApplicationStage.APPLIED ? 0 : 6, 60),
    );
    let stageChangedAt =
      stage === ApplicationStage.APPLIED
        ? appliedAt
        : between(appliedAt, new Date(NOW));
    if (stage === ApplicationStage.PLACED && placedThisMonth < 4) {
      stageChangedAt = between(
        new Date(Math.max(startOfMonth.getTime(), appliedAt.getTime())),
        new Date(NOW),
      );
      placedThisMonth++;
    }
    applicationRows.push({
      organizationId,
      candidateId: candidate.id,
      jobId: job.id,
      stage,
      rejectionReason:
        stage === ApplicationStage.REJECTED ? pick(REJECTION_REASONS) : null,
      rating: chance(0.55) ? int(0, 5) : null,
      shortlisted:
        [
          ApplicationStage.INTERVIEW,
          ApplicationStage.OFFER,
          ApplicationStage.PLACED,
        ].includes(stage) || chance(0.15),
      source: candidate.source,
      answers: job.screeningQuestions.map((q, qi) => ({
        questionId: q.id,
        question: q.question,
        answer:
          qi === 0
            ? 'Yes'
            : qi === 1
              ? String(candidate.yearsExperience ?? 1)
              : pick(['Immediately', 'In two weeks', 'In one month']),
      })),
      stageChangedAt,
      ownerId: job.ownerId ?? pick(team),
      appliedAt,
      createdAt: appliedAt,
    });
  }
  const applications = await applicationRepo.save(
    applicationRows.map((a) => applicationRepo.create(a)),
    { chunk: 50 },
  );
  const jobById = new Map(jobs.map((j) => [j.id, j]));
  const candidateById = new Map(candidates.map((c) => [c.id, c]));

  const activities: Array<DeepPartial<ActivityEntity>> = [];
  for (const candidate of candidates) {
    activities.push({
      organizationId,
      candidateId: candidate.id,
      type: ActivityType.CREATED,
      title: `${candidate.firstName} ${candidate.lastName} added to the talent pool`,
      metadata: { source: candidate.source },
      actorId:
        candidate.source === CandidateSource.CAREERS_PAGE
          ? null
          : candidate.ownerId,
      createdAt: candidate.createdAt,
    });
  }
  for (const app of applications) {
    const job = jobById.get(app.jobId)!;
    const candidate = candidateById.get(app.candidateId)!;
    const base = {
      organizationId,
      candidateId: app.candidateId,
      applicationId: app.id,
      jobId: app.jobId,
      clientId: job.clientId,
    };
    activities.push({
      ...base,
      type: ActivityType.CREATED,
      title: `Applied for ${job.title}`,
      metadata: { source: app.source },
      actorId: app.source === CandidateSource.CAREERS_PAGE ? null : app.ownerId,
      createdAt: app.appliedAt,
    });
    const target = app.stage;
    const path: ApplicationStage[] = FUNNEL.includes(target)
      ? FUNNEL.slice(0, FUNNEL.indexOf(target) + 1)
      : [...FUNNEL.slice(0, int(1, 3)), target];
    let previousAt = app.appliedAt;
    for (let s = 1; s < path.length; s++) {
      const at =
        s === path.length - 1
          ? app.stageChangedAt
          : between(previousAt, app.stageChangedAt);
      activities.push({
        ...base,
        type: ActivityType.STAGE_CHANGE,
        title: `${candidate.firstName} ${candidate.lastName} moved to ${path[s]}`,
        body:
          path[s] === ApplicationStage.REJECTED ? app.rejectionReason : null,
        metadata: { from: path[s - 1], to: path[s] },
        actorId: app.ownerId,
        createdAt: at,
      });
      previousAt = at;
    }
  }
  for (let i = 0; i < 60; i++) {
    const app = pick(applications);
    activities.push({
      organizationId,
      candidateId: app.candidateId,
      applicationId: app.id,
      jobId: app.jobId,
      clientId: jobById.get(app.jobId)!.clientId,
      type: ActivityType.NOTE,
      title: 'Note added',
      body: pick(NOTES),
      actorId: pick(team),
      createdAt: between(app.appliedAt, new Date(NOW)),
    });
  }
  for (let i = 0; i < 30; i++) {
    const app = pick(applications);
    const isCall = i % 2 === 0;
    activities.push({
      organizationId,
      candidateId: app.candidateId,
      applicationId: app.id,
      jobId: app.jobId,
      clientId: jobById.get(app.jobId)!.clientId,
      type: isCall ? ActivityType.CALL : ActivityType.EMAIL,
      title: isCall ? pick(CALL_TITLES) : pick(EMAIL_SUBJECTS),
      body: isCall
        ? `Call lasted ${int(3, 25)} minutes. ${pick(NOTES)}`
        : 'Email sent to the candidate.',
      metadata: isCall ? { durationMinutes: int(3, 25) } : { sent: true },
      actorId: pick(team),
      createdAt: between(app.appliedAt, new Date(NOW)),
    });
  }
  const savedActivities = await activityRepo.save(
    activities.map((a) => activityRepo.create(a)),
    { chunk: 100 },
  );
  const sample = savedActivities[0];
  const persisted = await activityRepo.findOne({ where: { id: sample.id } });
  if (
    persisted &&
    activities[0].createdAt instanceof Date &&
    Math.abs(
      persisted.createdAt.getTime() - activities[0].createdAt.getTime(),
    ) > 1000
  ) {
    for (let i = 0; i < savedActivities.length; i++) {
      await activityRepo.update(
        { id: savedActivities[i].id },
        { createdAt: activities[i].createdAt },
      );
    }
  }

  const startOfToday = new Date(NOW);
  startOfToday.setHours(0, 0, 0, 0);
  const tasks: Array<DeepPartial<TaskEntity>> = [];
  for (let i = 0; i < 26; i++) {
    const app = pick(applications);
    const job = jobById.get(app.jobId)!;
    const candidate = candidateById.get(app.candidateId)!;
    const bucket = i % 13;
    let dueAt: Date;
    let status = TaskStatus.OPEN;
    let completedAt: Date | null = null;
    if (bucket < 3) {
      dueAt = daysAgo(int(1, 6));
    } else if (bucket < 7) {
      dueAt = new Date(startOfToday.getTime() + int(9, 17) * 3600 * 1000);
    } else if (bucket < 10) {
      dueAt = new Date(NOW + int(1, 10) * DAY);
    } else {
      dueAt = daysAgo(int(1, 10));
      status = TaskStatus.DONE;
      completedAt = between(new Date(dueAt.getTime() - 2 * DAY), dueAt);
    }
    const title = TASK_TITLES[i % TASK_TITLES.length];
    tasks.push({
      organizationId,
      title,
      description: `${title} for ${candidate.firstName} ${candidate.lastName} (${job.title}, ${clientById.get(job.clientId!)!.name}).`,
      dueAt,
      assigneeId: team[i % team.length],
      status,
      completedAt,
      candidateId: candidate.id,
      applicationId: app.id,
      jobId: job.id,
      clientId: job.clientId,
      createdBy: pick(team),
      createdAt: daysAgo(int(10, 20)),
    });
  }
  await taskRepo.save(
    tasks.map((t) => taskRepo.create(t)),
    { chunk: 50 },
  );

  const docTypes = [
    DocumentType.CV,
    DocumentType.ID,
    DocumentType.RIGHT_TO_WORK,
    DocumentType.REFERENCE,
    DocumentType.DBS,
  ];
  const docNames: Record<string, string> = {
    [DocumentType.CV]: 'CV',
    [DocumentType.ID]: 'Passport',
    [DocumentType.RIGHT_TO_WORK]: 'Right to work share code',
    [DocumentType.REFERENCE]: 'Employment reference',
    [DocumentType.DBS]: 'Enhanced DBS certificate',
  };
  const documents: Array<DeepPartial<CandidateDocumentEntity>> = [];
  for (const candidate of pickMany(candidates, 40)) {
    for (const type of pickMany(docTypes, int(1, 4))) {
      const verificationStatus = pick([
        DocumentVerificationStatus.PENDING,
        DocumentVerificationStatus.VERIFIED,
        DocumentVerificationStatus.VERIFIED,
        DocumentVerificationStatus.REJECTED,
      ]);
      const uploadedAt = between(candidate.createdAt, new Date(NOW));
      const hasExpiry =
        type === DocumentType.RIGHT_TO_WORK || type === DocumentType.DBS;
      documents.push({
        organizationId,
        candidateId: candidate.id,
        type,
        name: docNames[type],
        fileKey: `seed/${randomUUID()}.pdf`,
        fileName:
          `${candidate.firstName}-${candidate.lastName}-${type}.pdf`.replace(
            /[^A-Za-z0-9._-]/g,
            '',
          ),
        mimeType: 'application/pdf',
        sizeBytes: int(40000, 900000),
        verificationStatus,
        verifiedBy:
          verificationStatus === DocumentVerificationStatus.PENDING
            ? null
            : pick(team),
        verifiedAt:
          verificationStatus === DocumentVerificationStatus.PENDING
            ? null
            : between(uploadedAt, new Date(NOW)),
        expiresAt:
          hasExpiry && chance(0.7)
            ? toDateString(new Date(NOW + int(-20, 900) * DAY))
            : null,
        notes:
          verificationStatus === DocumentVerificationStatus.REJECTED
            ? 'Image unclear, please upload a clearer copy'
            : null,
        createdAt: uploadedAt,
      });
    }
  }
  await documentRepo.save(
    documents.map((d) => documentRepo.create(d)),
    { chunk: 50 },
  );

  await templateRepo.save(
    EMAIL_TEMPLATES.map((t) =>
      templateRepo.create({ ...t, organizationId, isDefault: true }),
    ),
  );

  const stageSummary = APPLICATION_STAGE_ORDER.map(
    (stage) =>
      `${stage}=${applications.filter((a) => a.stage === stage).length}`,
  ).join(', ');
  console.log(
    `ATS seed complete: ${clients.length} clients, ${contacts.length} contacts, ${jobs.length} jobs, ${candidates.length} candidates, ${applications.length} applications (${stageSummary}), ${activities.length} activities, ${tasks.length} tasks, ${documents.length} documents, ${EMAIL_TEMPLATES.length} email templates`,
  );
}
