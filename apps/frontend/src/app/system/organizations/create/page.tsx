'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { z } from 'zod/v4';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { Upload, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  logo: z.string().optional(),
  adminEmail: z.email('Invalid email address'),
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().optional(),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;

interface CreateOrgResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  adminUser: {
    id: string;
    email: string;
  };
}

interface CreatedOrgInfo {
  orgName: string;
  email: string;
  password: string;
}

function generatePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%&*';
  const all = uppercase + lowercase + digits + symbols;

  const required = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const remaining = Array.from(
    { length: 12 },
    () => all[Math.floor(Math.random() * all.length)],
  );

  return [...required, ...remaining].sort(() => Math.random() - 0.5).join('');
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Copied to clipboard');
  });
}

export default function CreateOrganizationPage() {
  const [createdOrgInfo, setCreatedOrgInfo] = useState<CreatedOrgInfo | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      adminEmail: '',
      adminFirstName: '',
      adminLastName: '',
      adminPassword: '',
    },
  });

  const onSubmit = async (data: CreateOrgFormData) => {
    try {
      const result = await fetchApi<CreateOrgResponse>(
        API_ROUTES.SYSTEM_ADMIN.ORGANIZATIONS.CREATE,
        {
          method: 'POST',
          body: JSON.stringify({
            name: data.name,
            logo: data.logo || null,
            adminEmail: data.adminEmail,
            adminFirstName: data.adminFirstName,
            adminLastName: data.adminLastName,
            adminPassword: data.adminPassword,
          }),
        },
      );

      setCreatedOrgInfo({
        orgName: result.organization.name,
        email: data.adminEmail,
        password: data.adminPassword,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create organization';
      toast.error(message);
    }
  };

  async function handleLogoUpload(file: File) {
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

      const uploadResponse = await fetch(uploadUrlResponse.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setValue('logo', uploadUrlResponse.path);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
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
    setValue('logo', '');
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (createdOrgInfo) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold">Organization Created</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {createdOrgInfo.orgName} has been created successfully
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-center mb-4">
                Admin Credentials
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {createdOrgInfo.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdOrgInfo.email)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Password
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {createdOrgInfo.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdOrgInfo.password)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              A welcome email with login credentials has been sent. The admin
              can log in immediately.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <Link href="/system/organizations" className="w-full">
                <Button variant="default" className="w-full">
                  Back to Organizations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/system/organizations"
          className="p-2 hover:bg-muted rounded-md"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-lg font-medium">Create Organization</h2>
          <p className="text-sm text-muted-foreground">
            Create a new organization with an admin account
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2 mt-2">
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
                      x
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed">
                    <div className="text-muted-foreground">Logo</div>
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

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-4">Admin User</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    {...register('adminEmail')}
                  />
                  {errors.adminEmail && (
                    <p className="text-sm text-destructive">
                      {errors.adminEmail.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminFirstName">First Name</Label>
                    <Input
                      id="adminFirstName"
                      placeholder="John"
                      {...register('adminFirstName')}
                    />
                    {errors.adminFirstName && (
                      <p className="text-sm text-destructive">
                        {errors.adminFirstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminLastName">Last Name</Label>
                    <Input
                      id="adminLastName"
                      placeholder="Doe"
                      {...register('adminLastName')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="adminPassword">Password</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0 px-2 text-xs"
                      onClick={() => {
                        const pwd = generatePassword();
                        setValue('adminPassword', pwd, {
                          shouldValidate: true,
                        });
                        setShowPassword(true);
                      }}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Generate Password
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      {...register('adminPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.adminPassword && (
                    <p className="text-sm text-destructive">
                      {errors.adminPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
