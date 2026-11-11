import type { PillTone } from '@/components/patterns';

export type InterviewStatus =
  'Scheduled' | 'Feedback due' | 'Completed' | 'Cancelled';
export type Recommendation = 'Strong yes' | 'Yes' | 'No' | 'Strong no';
export type InterviewFormat = 'Video' | 'Onsite';

export interface Rating {
  label: string;
  rating: number;
}

export interface Interview {
  id: string;
  isoDate: string;
  time: string;
  duration: string;
  candidate: string;
  role: string;
  stage: string;
  format: InterviewFormat;
  panel: string[];
  submitted: number;
  status: InterviewStatus;
  notes?: string;
  recommendation?: Recommendation;
  ratings?: Rating[];
}

export const STATUS_TONE: Record<InterviewStatus, PillTone> = {
  Scheduled: 'info',
  'Feedback due': 'warning',
  Completed: 'success',
  Cancelled: 'neutral',
};

export const REC_TONE: Record<Recommendation, PillTone> = {
  'Strong yes': 'success',
  Yes: 'success',
  No: 'danger',
  'Strong no': 'danger',
};

export const RECOMMENDATIONS: Recommendation[] = [
  'Strong yes',
  'Yes',
  'No',
  'Strong no',
];

export const INTERVIEW_TYPES = [
  'Phone screen',
  'Technical',
  'System design',
  'Portfolio review',
  'Hiring manager',
  'Onsite loop',
];

export const DURATIONS = ['30 min', '45 min', '60 min', '90 min', '4 h'];

export const INTERVIEWERS = [
  'Rohit Sharma',
  'Priya Kapoor',
  'Ana Martins',
  'Neha Reddy',
  'Vikram Joshi',
  'Kabir Shah',
  'Emma Wilson',
  'Arjun Nair',
  'Olivia Brown',
];

export const CANDIDATES: { name: string; role: string }[] = [
  { name: 'Aarav Mehta', role: 'Senior Backend Engineer' },
  { name: 'Sophie Laurent', role: 'Product Designer' },
  { name: 'Daniel Okafor', role: 'Data Analyst' },
  { name: 'Ishita Rao', role: 'Product Manager, Growth' },
  { name: 'Lucas Becker', role: 'DevOps Engineer' },
  { name: 'Hannah Kim', role: 'Frontend Engineer' },
  { name: 'Mateo Garcia', role: 'Sales Executive' },
  { name: 'Karthik Subramanian', role: 'Senior Backend Engineer' },
  { name: 'Laura Fischer', role: 'Product Designer' },
  { name: 'Omar Haddad', role: 'Data Analyst' },
  { name: 'Ravi Menon', role: 'Product Manager, Growth' },
  { name: 'Yusuf Demir', role: 'QA Engineer' },
];

export const SCORECARD_CRITERIA = [
  'Technical depth',
  'Problem solving',
  'Communication',
  'Ownership',
];

export const OFFICE_ADDRESS = 'Bengaluru office, 4th floor, Indiranagar';

export function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const RATINGS_STRONG: Rating[] = [
  { label: 'Technical depth', rating: 5 },
  { label: 'Problem solving', rating: 4 },
  { label: 'Communication', rating: 5 },
  { label: 'Ownership', rating: 4 },
];
const RATINGS_MID: Rating[] = [
  { label: 'Technical depth', rating: 4 },
  { label: 'Problem solving', rating: 4 },
  { label: 'Communication', rating: 3 },
  { label: 'Ownership', rating: 4 },
];
const RATINGS_WEAK: Rating[] = [
  { label: 'Technical depth', rating: 2 },
  { label: 'Problem solving', rating: 3 },
  { label: 'Communication', rating: 3 },
  { label: 'Ownership', rating: 2 },
];

export const INITIAL_INTERVIEWS: Interview[] = [
  {
    id: 'i1',
    isoDate: '2026-10-12',
    time: '10:00',
    duration: '60 min',
    candidate: 'Aarav Mehta',
    role: 'Senior Backend Engineer',
    stage: 'Technical',
    format: 'Video',
    panel: ['Rohit Sharma', 'Priya Kapoor'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i2',
    isoDate: '2026-10-12',
    time: '11:30',
    duration: '45 min',
    candidate: 'Sophie Laurent',
    role: 'Product Designer',
    stage: 'Portfolio review',
    format: 'Video',
    panel: ['Ana Martins'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i3',
    isoDate: '2026-10-12',
    time: '13:00',
    duration: '30 min',
    candidate: 'Daniel Okafor',
    role: 'Data Analyst',
    stage: 'Phone screen',
    format: 'Video',
    panel: ['Neha Reddy'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i4',
    isoDate: '2026-10-12',
    time: '15:00',
    duration: '45 min',
    candidate: 'Ishita Rao',
    role: 'Product Manager, Growth',
    stage: 'Hiring manager',
    format: 'Onsite',
    panel: ['Vikram Joshi'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i5',
    isoDate: '2026-10-13',
    time: '09:30',
    duration: '4 h',
    candidate: 'Lucas Becker',
    role: 'DevOps Engineer',
    stage: 'Onsite loop',
    format: 'Onsite',
    panel: ['Rohit Sharma', 'Kabir Shah', 'Emma Wilson', 'Arjun Nair'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i6',
    isoDate: '2026-10-13',
    time: '14:00',
    duration: '60 min',
    candidate: 'Hannah Kim',
    role: 'Frontend Engineer',
    stage: 'Technical',
    format: 'Video',
    panel: ['Priya Kapoor', 'Kabir Shah'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i7',
    isoDate: '2026-10-14',
    time: '11:00',
    duration: '45 min',
    candidate: 'Mateo Garcia',
    role: 'Sales Executive',
    stage: 'Role play',
    format: 'Video',
    panel: ['Olivia Brown'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i8',
    isoDate: '2026-10-14',
    time: '16:00',
    duration: '60 min',
    candidate: 'Nikhil Bose',
    role: 'Senior Backend Engineer',
    stage: 'System design',
    format: 'Video',
    panel: ['Arjun Nair', 'Rohit Sharma'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i9',
    isoDate: '2026-10-15',
    time: '10:30',
    duration: '45 min',
    candidate: 'Clara Novak',
    role: 'Product Designer',
    stage: 'Design exercise',
    format: 'Onsite',
    panel: ['Ana Martins', 'Emma Wilson'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'i10',
    isoDate: '2026-10-16',
    time: '12:00',
    duration: '30 min',
    candidate: 'Yusuf Demir',
    role: 'QA Engineer',
    stage: 'Phone screen',
    format: 'Video',
    panel: ['Neha Reddy'],
    submitted: 0,
    status: 'Scheduled',
  },
  {
    id: 'f1',
    isoDate: '2026-10-09',
    time: '16:00',
    duration: '60 min',
    candidate: 'Rahul Verma',
    role: 'Senior Backend Engineer',
    stage: 'System design',
    format: 'Video',
    panel: ['Arjun Nair'],
    submitted: 0,
    status: 'Feedback due',
  },
  {
    id: 'f2',
    isoDate: '2026-10-09',
    time: '12:00',
    duration: '45 min',
    candidate: 'Chloe Martin',
    role: 'Product Designer',
    stage: 'Design exercise',
    format: 'Onsite',
    panel: ['Ana Martins', 'Emma Wilson'],
    submitted: 1,
    status: 'Feedback due',
  },
  {
    id: 'f3',
    isoDate: '2026-10-08',
    time: '10:30',
    duration: '30 min',
    candidate: 'Kenji Watanabe',
    role: 'QA Engineer',
    stage: 'Phone screen',
    format: 'Video',
    panel: ['Neha Reddy'],
    submitted: 0,
    status: 'Feedback due',
  },
  {
    id: 'f4',
    isoDate: '2026-10-08',
    time: '14:00',
    duration: '4 h',
    candidate: 'Fatima Zahra',
    role: 'Frontend Engineer',
    stage: 'Onsite loop',
    format: 'Onsite',
    panel: ['Priya Kapoor', 'Kabir Shah', 'Vikram Joshi'],
    submitted: 2,
    status: 'Feedback due',
  },
  {
    id: 'f5',
    isoDate: '2026-10-07',
    time: '17:00',
    duration: '45 min',
    candidate: 'Tom Becker',
    role: 'Data Analyst',
    stage: 'SQL exercise',
    format: 'Video',
    panel: ['Neha Reddy', 'Arjun Nair'],
    submitted: 1,
    status: 'Feedback due',
  },
  {
    id: 'f6',
    isoDate: '2026-10-07',
    time: '11:00',
    duration: '30 min',
    candidate: 'Isabel Ortiz',
    role: 'Marketing Lead',
    stage: 'Phone screen',
    format: 'Video',
    panel: ['Olivia Brown'],
    submitted: 0,
    status: 'Feedback due',
  },
  {
    id: 'p1',
    isoDate: '2026-10-08',
    time: '15:00',
    duration: '60 min',
    candidate: 'Meera Pillai',
    role: 'Frontend Engineer',
    stage: 'Final round',
    format: 'Onsite',
    panel: ['Vikram Joshi', 'Priya Kapoor'],
    submitted: 2,
    status: 'Completed',
    recommendation: 'Strong yes',
    ratings: RATINGS_STRONG,
  },
  {
    id: 'p2',
    isoDate: '2026-10-07',
    time: '11:00',
    duration: '60 min',
    candidate: 'Aarav Mehta',
    role: 'Senior Backend Engineer',
    stage: 'Phone screen',
    format: 'Video',
    panel: ['Priya Kapoor'],
    submitted: 1,
    status: 'Completed',
    recommendation: 'Yes',
    ratings: RATINGS_MID,
  },
  {
    id: 'p3',
    isoDate: '2026-10-06',
    time: '14:30',
    duration: '45 min',
    candidate: 'Ben Carter',
    role: 'Data Analyst',
    stage: 'SQL exercise',
    format: 'Video',
    panel: ['Neha Reddy'],
    submitted: 1,
    status: 'Completed',
    recommendation: 'No',
    ratings: RATINGS_WEAK,
  },
  {
    id: 'p4',
    isoDate: '2026-10-06',
    time: '10:00',
    duration: '45 min',
    candidate: 'Sophie Laurent',
    role: 'Product Designer',
    stage: 'Recruiter screen',
    format: 'Video',
    panel: ['Olivia Brown'],
    submitted: 1,
    status: 'Completed',
    recommendation: 'Strong yes',
    ratings: RATINGS_STRONG,
  },
  {
    id: 'p5',
    isoDate: '2026-10-05',
    time: '16:00',
    duration: '60 min',
    candidate: 'Lucas Becker',
    role: 'DevOps Engineer',
    stage: 'Technical',
    format: 'Video',
    panel: ['Rohit Sharma', 'Kabir Shah'],
    submitted: 2,
    status: 'Completed',
    recommendation: 'Yes',
    ratings: RATINGS_MID,
  },
  {
    id: 'p6',
    isoDate: '2026-10-05',
    time: '10:00',
    duration: '30 min',
    candidate: 'Zara Ahmed',
    role: 'Marketing Lead',
    stage: 'Phone screen',
    format: 'Video',
    panel: ['Olivia Brown'],
    submitted: 0,
    status: 'Cancelled',
  },
  {
    id: 'p7',
    isoDate: '2026-10-02',
    time: '13:00',
    duration: '60 min',
    candidate: 'Leo Rossi',
    role: 'Senior Backend Engineer',
    stage: 'Technical',
    format: 'Video',
    panel: ['Arjun Nair', 'Priya Kapoor'],
    submitted: 2,
    status: 'Completed',
    recommendation: 'Strong no',
    ratings: RATINGS_WEAK,
  },
];
