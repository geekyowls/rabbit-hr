export enum UserStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum IntegrationCategory {
  CALENDAR = 'calendar',
  VIDEO_CONFERENCING = 'video_conferencing',
  MESSAGING = 'messaging',
  PRODUCTIVITY = 'productivity',
  AI = 'ai',
  TELEPHONY = 'telephony',
  PAYMENTS = 'payments',
}

export enum IntegrationAuthType {
  OAUTH = 'oauth',
  API_KEY = 'api_key',
}

export enum OrganizationIntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  EXPIRED = 'expired',
  ERROR = 'error',
}

export enum InteractionType {
  CALL = 'call',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  SMS = 'sms',
  IN_PERSON = 'in_person',
  OTHER = 'other',
}

export enum InteractionDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum InteractionStatus {
  COMPLETED = 'completed',
  MISSED = 'missed',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
}

export enum NoteEntityType {
  LEAD = 'lead',
  CLIENT = 'client',
  COUNSELLING = 'counselling',
  FOLLOW_UP = 'follow_up',
  SUBSCRIPTION = 'subscription',
}

export enum NoteType {
  GENERAL = 'general',
  COUNSELLING = 'counselling',
  STICKY = 'sticky',
}

export enum CounsellingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

export enum DietType {
  VEG = 'veg',
  NON_VEG = 'non_veg',
  VEGAN = 'vegan',
  EGGETARIAN = 'eggetarian',
}

export enum PdfTemplate {
  DEFAULT = 'default',
  VARIATION_2 = 'variation-2',
  VARIATION_3 = 'variation-3',
  VARIATION_4 = 'variation-4',
  WEEKLY_GRID = 'weekly-grid',
  TWO_COLUMN = 'two-column',
  PLAIN_GRID = 'plain-grid',
  CLINIC_TABLE = 'clinic-table',
  MONO_MINIMAL = 'mono-minimal',
  COMPACT_LIST = 'compact-list',
}

export enum ContentType {
  BANNER = 'banner',
  TRANSFORMATION = 'transformation',
  BLOG = 'blog',
  ARTICLE = 'article',
  ANNOUNCEMENT = 'announcement',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ContentTargetAudience {
  ALL = 'all',
  CLIENTS = 'clients',
  LEADS = 'leads',
  USERS = 'users',
}

export enum ContentShowFrequency {
  ALWAYS = 'always',
  ONCE_PER_SESSION = 'once_per_session',
  ONCE_PER_DAY = 'once_per_day',
  ONCE = 'once',
}

export enum OrgSubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  GRACE = 'grace',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

export enum PaymentProvider {
  DODO = 'dodo',
  RAZORPAY = 'razorpay',
  APPLE_IAP = 'apple_iap',
}

export enum OrganizationConfigType {
  CLIENT_TAG = 'client_tag',
  MESSAGE_TEMPLATE = 'message_template',
  MEDICAL_CONDITION = 'medical_condition',
  ALLERGY = 'allergy',
  HEALTH_OBJECTIVE = 'health_objective',
}

export enum SystemBannerType {
  ALERT = 'alert',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
  FEATURE = 'feature',
}

export enum SystemBannerStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum SystemBannerShowFrequency {
  ALWAYS = 'always',
  ONCE_PER_SESSION = 'once_per_session',
  ONCE_EVER = 'once_ever',
}

export enum FoodStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
}

export enum FoodType {
  INGREDIENT = 'ingredient',
  PREPARED = 'prepared',
}

export enum ServingTemperature {
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
}

export enum FoodDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum FoodCuisine {
  GENERAL = 'general',
  NORTH_INDIAN = 'north_indian',
  SOUTH_INDIAN = 'south_indian',
  CHINESE = 'chinese',
  ITALIAN = 'italian',
  MEXICAN = 'mexican',
  MEDITERRANEAN = 'mediterranean',
  GUJARATI = 'gujarati',
  MAHARASHTRIAN = 'maharashtrian',
  EXOTIC = 'exotic',
}

export enum MealType {
  MAIN = 'main',
  SNACK = 'snack',
}

export enum OrgPaymentLinkStatus {
  CREATED = 'created',
  PAID = 'paid',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum DietGoal {
  WEIGHT_LOSS = 'weight_loss',
  WEIGHT_GAIN = 'weight_gain',
  MAINTENANCE = 'maintenance',
  MUSCLE_BUILDING = 'muscle_building',
  GENERAL = 'general',
}

export enum CalorieRange {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum MealPattern {
  REGULAR = 'regular',
  INTERMITTENT_FASTING = 'intermittent_fasting',
  OMAD = 'omad',
  TWO_MEALS = 'two_meals',
}

export enum ImportSourceType {
  DIET_TEMPLATE = 'diet_template',
}

export enum ExerciseCategory {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  MOBILITY = 'mobility',
  HIIT = 'hiit',
  YOGA = 'yoga',
}

export enum ExerciseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum WorkoutGoal {
  STRENGTH = 'strength',
  FAT_LOSS = 'fat_loss',
  ENDURANCE = 'endurance',
  MOBILITY = 'mobility',
  GENERAL = 'general',
}

export enum WorkoutDayType {
  WORKOUT = 'workout',
  REST = 'rest',
}

export enum ArticleStatus {
  PENDING_BRIEF = 'pending_brief',
  BRIEF_READY = 'brief_ready',
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  NEEDS_REFRESH = 'needs_refresh',
}

export enum ArticleType {
  COMPARISON = 'comparison',
  ALTERNATIVES = 'alternatives',
  USE_CASE = 'use_case',
  WORKFLOW = 'workflow',
  EDUCATIONAL = 'educational',
  PROGRAMMATIC = 'programmatic',
  PILLAR = 'pillar',
}

export enum KeywordOpportunityStatus {
  NEW = 'new',
  CLUSTERED = 'clustered',
  BRIEF_CREATED = 'brief_created',
  ARTICLE_PUBLISHED = 'article_published',
  REJECTED = 'rejected',
}

export enum KeywordIntent {
  COMMERCIAL = 'commercial',
  INFORMATIONAL = 'informational',
  NAVIGATIONAL = 'navigational',
  TRANSACTIONAL = 'transactional',
}

export enum ArticleBriefStatus {
  PENDING = 'pending',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export enum AccountDeletionRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export enum AccountDeletionScope {
  ACCOUNT_AND_DATA = 'account_and_data',
  SPECIFIC_DATA = 'specific_data',
}

export enum ClientStatus {
  ACTIVE = 'active',
  RETIRED = 'retired',
}

export enum EmploymentType {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
  CONTRACT = 'contract',
}

export enum WorkMode {
  ONSITE = 'onsite',
  HYBRID = 'hybrid',
  REMOTE = 'remote',
}

export enum RateUnit {
  HOUR = 'hour',
  DAY = 'day',
  YEAR = 'year',
}

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ON_HOLD = 'on_hold',
  CLOSED = 'closed',
  FILLED = 'filled',
}

export enum CandidateSource {
  CAREERS_PAGE = 'careers_page',
  LINKEDIN = 'linkedin',
  INDEED = 'indeed',
  REED = 'reed',
  TOTALJOBS = 'totaljobs',
  CV_LIBRARY = 'cv_library',
  REFERRAL = 'referral',
  AGENCY_DATABASE = 'agency_database',
  OTHER = 'other',
}

export enum RightToWork {
  UNKNOWN = 'unknown',
  UK_CITIZEN = 'uk_citizen',
  SETTLED_STATUS = 'settled_status',
  VISA_SPONSORSHIP_REQUIRED = 'visa_sponsorship_required',
  WORK_VISA = 'work_visa',
}

export enum PipelineStageCategory {
  APPLIED = 'applied',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export const CLOSED_PIPELINE_STAGE_CATEGORIES: PipelineStageCategory[] = [
  PipelineStageCategory.HIRED,
  PipelineStageCategory.REJECTED,
  PipelineStageCategory.WITHDRAWN,
];

export interface DefaultPipelineStage {
  key: string;
  name: string;
  category: PipelineStageCategory;
  color: string;
}

export const DEFAULT_PIPELINE_STAGES: DefaultPipelineStage[] = [
  {
    key: 'applied',
    name: 'Applied',
    category: PipelineStageCategory.APPLIED,
    color: 'slate',
  },
  {
    key: 'screening',
    name: 'Screening',
    category: PipelineStageCategory.SCREENING,
    color: 'blue',
  },
  {
    key: 'interview',
    name: 'Interview',
    category: PipelineStageCategory.INTERVIEW,
    color: 'violet',
  },
  {
    key: 'offer',
    name: 'Offer',
    category: PipelineStageCategory.OFFER,
    color: 'amber',
  },
  {
    key: 'placed',
    name: 'Placed',
    category: PipelineStageCategory.HIRED,
    color: 'emerald',
  },
  {
    key: 'rejected',
    name: 'Rejected',
    category: PipelineStageCategory.REJECTED,
    color: 'rose',
  },
  {
    key: 'withdrawn',
    name: 'Withdrawn',
    category: PipelineStageCategory.WITHDRAWN,
    color: 'zinc',
  },
];

export enum CustomFieldEntityType {
  CANDIDATE = 'candidate',
  JOB = 'job',
}

export enum CustomFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  BOOLEAN = 'boolean',
  URL = 'url',
}

export enum SalaryPeriod {
  YEAR = 'year',
  MONTH = 'month',
  DAY = 'day',
  HOUR = 'hour',
}

export enum AtsDateFormat {
  DMY = 'DD/MM/YYYY',
  MDY = 'MM/DD/YYYY',
  ISO = 'YYYY-MM-DD',
}

export enum ActivityType {
  NOTE = 'note',
  STAGE_CHANGE = 'stage_change',
  EMAIL = 'email',
  CALL = 'call',
  CREATED = 'created',
  DOCUMENT = 'document',
  TASK = 'task',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  WHATSAPP = 'whatsapp',
  PORTAL = 'portal',
}

export enum TaskStatus {
  OPEN = 'open',
  DONE = 'done',
}

export enum TaskDueFilter {
  OVERDUE = 'overdue',
  TODAY = 'today',
  UPCOMING = 'upcoming',
}

export enum DocumentType {
  CV = 'cv',
  ID = 'id',
  RIGHT_TO_WORK = 'right_to_work',
  REFERENCE = 'reference',
  CERTIFICATE = 'certificate',
  DBS = 'dbs',
  OTHER = 'other',
}

export enum DocumentVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum EmailTemplateCategory {
  INVITE = 'invite',
  REJECTION = 'rejection',
  OFFER = 'offer',
  INTERVIEW = 'interview',
  GENERAL = 'general',
}

export enum InterviewType {
  PHONE = 'phone',
  VIDEO = 'video',
  ONSITE = 'onsite',
  TECHNICAL = 'technical',
  PANEL = 'panel',
  ASSESSMENT = 'assessment',
  OTHER = 'other',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ScorecardRecommendation {
  STRONG_YES = 'strong_yes',
  YES = 'yes',
  NO = 'no',
  STRONG_NO = 'strong_no',
}

export enum OfferStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
}

export enum OfferDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum OfferResponse {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum CallDirection {
  OUTBOUND = 'outbound',
  INBOUND = 'inbound',
}

export enum CallStatus {
  INITIATED = 'initiated',
  COMPLETED = 'completed',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CallDisposition {
  CONNECTED = 'connected',
  NO_ANSWER = 'no_answer',
  VOICEMAIL = 'voicemail',
  BUSY = 'busy',
  WRONG_NUMBER = 'wrong_number',
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not_interested',
  CALLBACK_REQUESTED = 'callback_requested',
}

export enum WhatsappMessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum MailboxProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
}

export enum MailboxConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  EXPIRED = 'expired',
  ERROR = 'error',
}

export enum EmailFolder {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  ARCHIVE = 'archive',
  TRASH = 'trash',
}

export enum EmailDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum EmailDeliveryStatus {
  SENT = 'sent',
  DEMO = 'demo',
}

export enum InboxSearchIn {
  ALL = 'all',
  SUBJECT = 'subject',
  FROM_TO = 'from_to',
}

export enum InboxLinkedFilter {
  CANDIDATE = 'candidate',
  CLIENT = 'client',
  UNLINKED = 'unlinked',
}

export enum InterviewMeetingProvider {
  NONE = 'none',
  GOOGLE_MEET = 'google_meet',
  ZOOM = 'zoom',
  TEAMS = 'teams',
  MANUAL = 'manual',
}

export enum CalendarSyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum InterviewBookingMode {
  ANY_INTERVIEWER = 'any_interviewer',
  ALL_INTERVIEWERS = 'all_interviewers',
}

export enum InterviewBookingLinkStatus {
  OPEN = 'open',
  BOOKED = 'booked',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
