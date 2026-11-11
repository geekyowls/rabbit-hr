'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { Building2, Upload, X } from 'lucide-react';
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
import { Organization } from '@/types/organization.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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
      privacyPolicyUrl: null,
      termsAndConditionsUrl: null,
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
        privacyPolicyUrl: data.privacyPolicyUrl || null,
        termsAndConditionsUrl: data.termsAndConditionsUrl || null,
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
      toast.success('Logo uploaded');
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
        privacyPolicyUrl: data.privacyPolicyUrl || null,
        termsAndConditionsUrl: data.termsAndConditionsUrl || null,
      };

      await fetchApi(API_ROUTES.ORGANIZATION.UPDATE, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success('Organization updated');
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
                  <Label htmlFor="name">Organization name</Label>
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
                        {isUploading ? 'Uploading' : 'Upload logo'}
                      </Button>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6" data-tour="org-contact-info">
                <h3 className="mb-4 text-sm font-medium">Contact details</h3>
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
                    <Label htmlFor="street">Street address</Label>
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
                    <Label htmlFor="state">State or region</Label>
                    <Input
                      id="state"
                      {...register('address.state')}
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Postal code</Label>
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

              <div className="border-t pt-6" data-tour="org-legal">
                <h3 className="mb-1 text-sm font-medium">Legal links</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  Your privacy policy and terms of use
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="privacyPolicyUrl">Privacy policy URL</Label>
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
                    <Label htmlFor="termsAndConditionsUrl">Terms URL</Label>
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

              {canEdit && (
                <div className="flex justify-end border-t pt-6">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving' : 'Save changes'}
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
