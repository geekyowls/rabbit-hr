'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import {
  Building2,
  Upload,
  X,
  Check,
  FileText,
  Shield,
  Smartphone,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from '@/lib/toast';
import {
  organizationSchema,
  OrganizationFormData,
} from '@/schemas/organization.schema';
import {
  Organization,
  PDF_TEMPLATE_OPTIONS,
  PdfTemplate,
} from '@/types/organization.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const PDF_TEMPLATE_PREVIEWS: Record<
  PdfTemplate,
  { image: string; description: string }
> = {
  default: {
    image: '/pdf-templates/classic-elegant.png',
    description: 'Clean, professional layout with traditional styling',
  },
  'variation-2': {
    image: '/pdf-templates/modern-bold.png',
    description: 'Contemporary design with bold typography',
  },
  'variation-3': {
    image: '/pdf-templates/timeline-style.png',
    description: 'Visual timeline format for meal progression',
  },
  'variation-4': {
    image: '/pdf-templates/card-grid.png',
    description: 'Card-based layout for easy meal scanning',
  },
  'weekly-grid': {
    image: '/pdf-templates/card-grid.png',
    description:
      'Timetable view — days as columns, meals as rows. Best on landscape print.',
  },
  'two-column': {
    image: '/pdf-templates/two-column.png',
    description:
      'Compact two-column layout that fits a full week in 4-5 pages without dropping meal detail.',
  },
  'plain-grid': {
    image: '/pdf-templates/plain-grid.png',
    description:
      'Simple black-and-white timetable. Days as columns, meals as rows, no styling. Prints on landscape.',
  },
  'clinic-table': {
    image: '/pdf-templates/clinic-table.png',
    description:
      'Professional spreadsheet-style tables per day with a clinical blue header. Meal, time, food, and quantity columns.',
  },
  'mono-minimal': {
    image: '/pdf-templates/mono-minimal.png',
    description:
      'Plain black-and-white serif layout. No colour, no boxes. Reads like a printed prescription sheet.',
  },
  'compact-list': {
    image: '/pdf-templates/compact-list.png',
    description:
      'Condensed one-line-per-meal list with a light green accent. Just time and food, fits the week in 2-3 pages.',
  },
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeAddress(address: OrganizationFormData['address']) {
  if (!address) return null;

  const normalized = {
    street: normalizeOptionalString(address.street),
    city: normalizeOptionalString(address.city),
    state: normalizeOptionalString(address.state),
    zipCode: normalizeOptionalString(address.zipCode),
    country: normalizeOptionalString(address.country),
  };

  const hasAnyValue = Object.values(normalized).some(Boolean);
  return hasAnyValue ? normalized : null;
}

function OrganizationSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-24 w-24 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationSettingsContent() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERMISSIONS_ENUM.ORGANIZATION_UPDATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      logo: null,
      phone: null,
      email: null,
      website: null,
      address: undefined,
      pdfTemplate: 'default',
      privacyPolicyUrl: null,
      termsAndConditionsUrl: null,
      showGoogleLogin: true,
      showAppleLogin: true,
      hideDietitianName: false,
      reEngagementEmailsEnabled: true,
      invoicePrefix: '',
      invoiceDefaultNotes: '',
    },
  });

  const logoValue = watch('logo');

  useEffect(() => {
    loadOrganization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logoValue) {
      setLogoPreview(logoValue);
    }
  }, [logoValue]);

  async function loadOrganization() {
    try {
      const data = await fetchApi<Organization>(API_ROUTES.ORGANIZATION.GET);
      reset({
        name: data.name,
        logo: data.logo,
        phone: data.phone,
        email: data.email || '',
        website: data.website || '',
        address: data.address ?? undefined,
        pdfTemplate: data.pdfTemplate || 'default',
        privacyPolicyUrl: data.privacyPolicyUrl || null,
        termsAndConditionsUrl: data.termsAndConditionsUrl || null,
        showGoogleLogin: data.clientAppConfig?.showGoogleLogin ?? true,
        showAppleLogin: data.clientAppConfig?.showAppleLogin ?? true,
        hideDietitianName: data.clientAppConfig?.hideDietitianName ?? false,
        reEngagementEmailsEnabled:
          data.featureControls?.reEngagementEmailsEnabled ?? true,
        invoicePrefix: data.invoiceSettings?.prefix || '',
        invoiceDefaultNotes: data.invoiceSettings?.defaultNotes || '',
      });
      setLogoPreview(data.logo ?? null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load organization';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!canEdit) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const uploadUrlResponse = await fetchApi<{
        signedUrl: string;
        path: string;
      }>(`${API_ROUTES.STORAGE.UPLOAD_URL}?extension=${extension}&type=image`);

      await fetch(uploadUrlResponse.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      setValue('logo', uploadUrlResponse.path);
      setLogoPreview(URL.createObjectURL(file));
      toast.success('Logo uploaded successfully');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to upload logo';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveLogo() {
    if (!canEdit) return;
    setValue('logo', null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function onSubmit(data: OrganizationFormData) {
    if (!canEdit) return;
    try {
      const payload = {
        name: data.name,
        logo: data.logo || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        address: normalizeAddress(data.address),
        pdfTemplate: data.pdfTemplate,
        privacyPolicyUrl: data.privacyPolicyUrl || null,
        termsAndConditionsUrl: data.termsAndConditionsUrl || null,
        showGoogleLogin: data.showGoogleLogin,
        showAppleLogin: data.showAppleLogin,
        hideDietitianName: data.hideDietitianName,
        reEngagementEmailsEnabled: data.reEngagementEmailsEnabled,
        invoiceSettings: {
          prefix: data.invoicePrefix || undefined,
          defaultNotes: data.invoiceDefaultNotes || undefined,
        },
      };

      await fetchApi(API_ROUTES.ORGANIZATION.UPDATE, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success('Organization updated successfully');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update organization';
      toast.error(message);
    }
  }

  if (isLoading) {
    return <OrganizationSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Organization" backHref="/dashboard/settings" />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardContent className="pt-6">
            <fieldset disabled={!canEdit} className="space-y-6">
              <div
                className="grid gap-6 md:grid-cols-2"
                data-tour="org-basic-info"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter organization name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Organization logo"
                          className="h-16 w-16 rounded-lg object-cover border"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6" data-tour="org-contact-info">
                <h3 className="mb-4 text-sm font-medium">
                  Contact Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="contact@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      {...register('website')}
                      placeholder="https://example.com"
                    />
                    {errors.website && (
                      <p className="text-sm text-destructive">
                        {errors.website.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6" data-tour="org-address">
                <h3 className="mb-4 text-sm font-medium">Address</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      {...register('address.street')}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register('address.city')}
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      {...register('address.state')}
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                    <Input
                      id="zipCode"
                      {...register('address.zipCode')}
                      placeholder="12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      {...register('address.country')}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6" data-tour="org-privacy-terms">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Client app – Privacy & Terms
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  URLs shown in the mobile app web view (Privacy Policy and
                  Terms & Conditions)
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="privacyPolicyUrl">Privacy Policy URL</Label>
                    <Input
                      id="privacyPolicyUrl"
                      {...register('privacyPolicyUrl')}
                      placeholder="https://example.com/privacy"
                    />
                    {errors.privacyPolicyUrl && (
                      <p className="text-sm text-destructive">
                        {errors.privacyPolicyUrl.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="termsAndConditionsUrl">
                      Terms & Conditions URL
                    </Label>
                    <Input
                      id="termsAndConditionsUrl"
                      {...register('termsAndConditionsUrl')}
                      placeholder="https://example.com/terms"
                    />
                    {errors.termsAndConditionsUrl && (
                      <p className="text-sm text-destructive">
                        {errors.termsAndConditionsUrl.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6" data-tour="org-client-app">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <Smartphone className="h-4 w-4" />
                  Client App Settings
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Configure how your mobile app appears and functions for
                  clients
                </p>
                <div className="space-y-4">
                  <Controller
                    name="hideDietitianName"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="hideDietitianName"
                            className="text-base font-medium"
                          >
                            Hide Dietitian Details
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Hide your name and details on the client&apos;s
                            profile card
                          </p>
                        </div>
                        <Switch
                          id="hideDietitianName"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="showGoogleLogin"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="showGoogleLogin"
                            className="text-base font-medium"
                          >
                            Google Sign-In
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow clients to sign in with their Google account
                          </p>
                        </div>
                        <Switch
                          id="showGoogleLogin"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="showAppleLogin"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="showAppleLogin"
                            className="text-base font-medium"
                          >
                            Apple Sign-In
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow clients to sign in with their Apple account
                          </p>
                        </div>
                        <Switch
                          id="showAppleLogin"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                  Workspace Notifications
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Email reminders for dietitians and admins in this org
                </p>
                <div className="space-y-4">
                  <Controller
                    name="reEngagementEmailsEnabled"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="reEngagementEmailsEnabled"
                            className="text-base font-medium"
                          >
                            Re-engagement Emails
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Email users who haven&apos;t used the dashboard in 2
                            days, at most once every 5 days.
                          </p>
                        </div>
                        <Switch
                          id="reEngagementEmailsEnabled"
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-6" data-tour="org-invoice-settings">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <Receipt className="h-4 w-4" />
                  Invoice Settings
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Configure how invoice numbers are generated and default notes
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Series Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      {...register('invoicePrefix')}
                      placeholder="INV"
                    />
                    <p className="text-xs text-muted-foreground">
                      Invoices will be numbered as PREFIX-0001, PREFIX-0002,
                      etc.
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="invoiceDefaultNotes">
                      Default Invoice Notes
                    </Label>
                    <Textarea
                      id="invoiceDefaultNotes"
                      {...register('invoiceDefaultNotes')}
                      placeholder="Footer text that appears on every new invoice..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6" data-tour="org-pdf-template">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  PDF Export Settings
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Choose the visual style for exported diet plan PDFs
                </p>
                <Controller
                  name="pdfTemplate"
                  control={control}
                  render={({ field }) => (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {PDF_TEMPLATE_OPTIONS.map((option) => {
                        const preview = PDF_TEMPLATE_PREVIEWS[option.value];
                        const isSelected = field.value === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              'relative flex flex-col overflow-hidden rounded-lg border-2 transition-all hover:border-primary/50',
                              isSelected
                                ? 'border-primary ring-2 ring-primary ring-offset-2'
                                : 'border-muted',
                            )}
                          >
                            {isSelected && (
                              <div className="absolute right-2 top-2 z-10 rounded-full bg-primary p-1">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                            <div className="relative aspect-[3/4] w-full bg-muted">
                              <img
                                src={preview.image}
                                alt={option.label}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove(
                                    'hidden',
                                  );
                                }}
                              />
                              <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
                                <FileText className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                            </div>
                            <div className="p-3 text-left">
                              <p className="font-medium text-sm">
                                {option.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {preview.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {canEdit && (
                <div className="flex justify-end border-t pt-6">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </fieldset>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.ORGANIZATION_READ}
      fallback={
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          You don&apos;t have permission to view organization settings
        </div>
      }
    >
      <OrganizationSettingsContent />
    </PermissionGuard>
  );
}
