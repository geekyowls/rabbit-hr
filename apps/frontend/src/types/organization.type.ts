export interface OrganizationAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export type PdfTemplate =
  | 'default'
  | 'variation-2'
  | 'variation-3'
  | 'variation-4'
  | 'weekly-grid'
  | 'two-column'
  | 'plain-grid'
  | 'clinic-table'
  | 'mono-minimal'
  | 'compact-list';

export const PDF_TEMPLATE_OPTIONS: { value: PdfTemplate; label: string }[] = [
  { value: 'default', label: 'Classic Elegant' },
  { value: 'variation-2', label: 'Modern Bold' },
  { value: 'variation-3', label: 'Timeline Style' },
  { value: 'variation-4', label: 'Card Grid' },
  { value: 'weekly-grid', label: 'Weekly Grid (Timetable)' },
  { value: 'two-column', label: 'Compact Two-Column' },
  { value: 'plain-grid', label: 'Plain Weekly Grid' },
  { value: 'clinic-table', label: 'Clinic Table (Blue)' },
  { value: 'mono-minimal', label: 'Minimal Mono' },
  { value: 'compact-list', label: 'Compact List' },
];

export interface ClientAppConfig {
  showGoogleLogin?: boolean;
  showAppleLogin?: boolean;
  hideDietitianName?: boolean;
}

export interface OrgFeatureControlsClient {
  reEngagementEmailsEnabled?: boolean;
  dailyDigestEnabled?: boolean;
}

export interface InvoiceSettings {
  prefix?: string;
  defaultNotes?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: OrganizationAddress | null;
  pdfTemplate: PdfTemplate;
  privacyPolicyUrl?: string | null;
  termsAndConditionsUrl?: string | null;
  clientAppConfig?: ClientAppConfig | null;
  featureControls?: OrgFeatureControlsClient | null;
  invoiceSettings?: InvoiceSettings | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationRequest {
  name: string;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: OrganizationAddress | null;
  pdfTemplate?: PdfTemplate;
  privacyPolicyUrl?: string | null;
  termsAndConditionsUrl?: string | null;
  showGoogleLogin?: boolean;
  showAppleLogin?: boolean;
  hideDietitianName?: boolean;
  reEngagementEmailsEnabled?: boolean;
  dailyDigestEnabled?: boolean;
  invoiceSettings?: InvoiceSettings | null;
}
