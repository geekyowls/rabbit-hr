'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { Download, FileText, Upload, X } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { formatBytes } from '@/lib/utils';
import {
  portalDocumentUrl,
  usePortalApplicationsQuery,
  usePortalDocumentsQuery,
  useUploadPortalDocumentMutation,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusPill } from '@/components/patterns';
import { DOCUMENT_TYPE_LABEL } from '@/components/applications/application-meta';
import { usePortalSession } from '@/components/portal/portal-session';
import {
  DocumentRequestItem,
  PortalCard,
  PortalEmpty,
  PortalList,
} from '@/components/portal/portal-items';
import {
  DOCUMENT_STATUS_META,
  portalDate,
} from '@/components/portal/portal-utils';
import { DOCUMENT_TYPES, type DocumentType } from '@/types/document.type';
import {
  PORTAL_UPLOAD_EXTENSIONS,
  PORTAL_UPLOAD_MAX_BYTES,
  type PortalDocument,
  type PortalUploadExtension,
} from '@/types/portal.type';

const NO_APPLICATION = 'none';

function fileExtension(name: string): PortalUploadExtension | null {
  const ext = name.split('.').pop()?.toLowerCase();
  return PORTAL_UPLOAD_EXTENSIONS.find((e) => e === ext) ?? null;
}

const uploadSchema = z.object({
  type: z.enum(DOCUMENT_TYPES as [DocumentType, ...DocumentType[]]),
  name: z.string().trim().max(200),
  applicationId: z.string(),
  file: z
    .instanceof(File, { message: 'Choose a file to upload' })
    .nullable()
    .refine((f) => Boolean(f), 'Choose a file to upload')
    .refine(
      (f) => !f || fileExtension(f.name) !== null,
      'Upload a PDF, Word document or image',
    )
    .refine(
      (f) => !f || f.size <= PORTAL_UPLOAD_MAX_BYTES,
      'Files must be 10 MB or smaller',
    ),
});

type UploadForm = {
  type: DocumentType;
  name: string;
  applicationId: string;
  file: File | null;
};

function UploadDialog({
  open,
  onOpenChange,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: DocumentType;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const upload = useUploadPortalDocumentMutation();
  const { data: applications = [] } = usePortalApplicationsQuery();
  const active = applications.filter((a) => !a.isClosed);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      type: defaultType,
      name: '',
      applicationId: NO_APPLICATION,
      file: null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: defaultType,
        name: '',
        applicationId: NO_APPLICATION,
        file: null,
      });
    }
  }, [open, defaultType, reset]);

  const onSubmit = async (values: UploadForm) => {
    if (!values.file) return;
    const extension = fileExtension(values.file.name);
    if (!extension) return;
    try {
      await upload.mutateAsync({
        file: values.file,
        extension,
        data: {
          type: values.type,
          name: values.name || undefined,
          applicationId:
            values.applicationId === NO_APPLICATION
              ? undefined
              : values.applicationId,
        },
      });
      toast.success('Document uploaded');
      onOpenChange(false);
    } catch (err) {
      toast.error(
        'Could not upload',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>
            The team will review it and mark it as verified
          </DialogDescription>
        </DialogHeader>
        <form
          id="portal-upload"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {DOCUMENT_TYPE_LABEL[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-name">Name</Label>
              <Input
                id="upload-name"
                className="h-9"
                placeholder="Optional"
                {...register('name')}
              />
            </div>
          </div>
          {active.length > 0 && (
            <div className="space-y-1.5">
              <Label>For application</Label>
              <Controller
                name="applicationId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_APPLICATION}>
                        All applications
                      </SelectItem>
                      {active.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.jobTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <Controller
            name="file"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    field.onChange(e.target.files?.[0] ?? null);
                    e.target.value = '';
                  }}
                />
                {field.value ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {field.value.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(field.value.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Remove file"
                      onClick={() => field.onChange(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-input px-4 py-5 text-center hover:bg-muted/40"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Choose a file</span>
                    <span className="text-xs text-muted-foreground">
                      PDF, Word or image, up to 10 MB
                    </span>
                  </button>
                )}
                {errors.file && (
                  <p className="text-sm text-destructive">
                    {errors.file.message}
                  </p>
                )}
              </div>
            )}
          />
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="portal-upload" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentItem({ document }: { document: PortalDocument }) {
  const status = DOCUMENT_STATUS_META[document.verificationStatus];
  const open = async () => {
    try {
      const { url } = await portalDocumentUrl(document.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(
        'Could not open the file',
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{document.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            DOCUMENT_TYPE_LABEL[document.type],
            document.fileName,
            portalDate(document.createdAt),
          ].join(' · ')}
        </p>
      </div>
      <StatusPill tone={status.tone}>{status.label}</StatusPill>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={`Download ${document.name}`}
        onClick={open}
      >
        <Download className="h-4 w-4" />
      </Button>
    </li>
  );
}

export default function PortalDocumentsPage() {
  const { brand } = usePortalSession();
  const { data, isLoading } = usePortalDocumentsQuery();
  const [uploadType, setUploadType] = useState<DocumentType | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Share documents securely with the hiring team
          </p>
        </div>
        <Button
          size="sm"
          className="text-white hover:opacity-90"
          style={{ backgroundColor: brand }}
          onClick={() => setUploadType('other')}
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>
      {isLoading || !data ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <>
          {data.requests.length > 0 && (
            <PortalCard title="Requested by the team">
              <PortalList>
                {data.requests.map((request) => (
                  <DocumentRequestItem
                    key={request.type}
                    request={request}
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUploadType(request.type)}
                      >
                        Upload
                      </Button>
                    }
                  />
                ))}
              </PortalList>
            </PortalCard>
          )}
          <PortalCard title="My documents">
            {data.documents.length ? (
              <PortalList>
                {data.documents.map((document) => (
                  <DocumentItem key={document.id} document={document} />
                ))}
              </PortalList>
            ) : (
              <PortalEmpty>No documents uploaded yet</PortalEmpty>
            )}
          </PortalCard>
        </>
      )}
      <UploadDialog
        open={uploadType !== null}
        onOpenChange={(o) => !o && setUploadType(null)}
        defaultType={uploadType ?? 'other'}
      />
    </div>
  );
}
