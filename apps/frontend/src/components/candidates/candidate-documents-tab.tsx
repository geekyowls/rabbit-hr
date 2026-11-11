'use client';

import { useFormatters } from '@/hooks/use-formatters';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { EmptyState, StatusPill, ToolbarButton } from '@/components/patterns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  useCandidateDocumentsQuery,
  useCreateCandidateDocumentMutation,
  useDeleteDocumentMutation,
  useDocumentDownloadUrlMutation,
  useVerifyDocumentMutation,
} from '@/hooks/queries';
import {
  DOCUMENT_TYPES,
  type CandidateDocument,
  type DocumentReviewStatus,
} from '@/types/document.type';
import {
  DOCUMENT_TYPE_LABEL,
  UPLOAD_ACCEPT,
  VERIFICATION_LABEL,
  VERIFICATION_TONE,
  errorMessage,
  uploadDocumentFile,
} from '@/components/applications/application-meta';
import { DocxViewer } from './docx-viewer';

const uploadSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  name: z.string().trim().max(200),
  expiresAt: z.date().nullable(),
  notes: z.string().trim().max(1000),
  file: z.custom<File | null>(
    (v) => v instanceof File,
    'Choose a file to upload',
  ),
});

type UploadFormData = z.infer<typeof uploadSchema>;

function UploadDocumentDialog({
  open,
  onOpenChange,
  candidateId,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  onUploaded: (doc: CandidateDocument) => void;
}) {
  const createDocument = useCreateCandidateDocumentMutation();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      type: 'cv',
      name: '',
      expiresAt: null,
      notes: '',
      file: null,
    },
  });
  const file = useWatch({ control, name: 'file' });

  useEffect(() => {
    if (open)
      reset({ type: 'cv', name: '', expiresAt: null, notes: '', file: null });
  }, [open, reset]);

  const submit = handleSubmit(async (data) => {
    if (!data.file) return;
    try {
      const uploaded = await uploadDocumentFile(data.file);
      const doc = await createDocument.mutateAsync({
        candidateId,
        data: {
          type: data.type,
          name: data.name || uploaded.fileName,
          fileKey: uploaded.key,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
          ...(data.expiresAt && { expiresAt: data.expiresAt.toISOString() }),
          ...(data.notes && { notes: data.notes }),
        },
      });
      toast.success('Document uploaded');
      onUploaded(doc);
      onOpenChange(false);
    } catch (err) {
      toast.error('Upload failed', errorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>
            Stored privately, only your team can download it
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {DOCUMENT_TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expires</Label>
              <Controller
                name="expiresAt"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? undefined}
                    onChange={(d) => field.onChange(d ?? null)}
                    placeholder="No expiry"
                    clearable
                    className="h-9 w-full"
                  />
                )}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-name" className="text-xs">
              Name
            </Label>
            <Input
              id="doc-name"
              className="h-9"
              placeholder="Defaults to the file name"
              {...register('name')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-notes" className="text-xs">
              Notes
            </Label>
            <Textarea id="doc-notes" rows={2} {...register('notes')} />
          </div>
          {file ? (
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(file.size, 1)}
              </span>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => setValue('file', null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-5 text-center hover:bg-accent">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                Click to choose a file
              </span>
              <span className="text-xs text-muted-foreground">
                PDF, DOC, DOCX or TXT up to 10MB
              </span>
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  setValue('file', e.target.files?.[0] ?? null, {
                    shouldValidate: true,
                  });
                  e.target.value = '';
                }}
              />
            </label>
          )}
          {errors.file && (
            <p className="text-xs text-destructive">{errors.file.message}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const reviewSchema = z.object({ notes: z.string().trim().max(1000) });
type ReviewFormData = z.infer<typeof reviewSchema>;

function ReviewDocumentDialog({
  document,
  status,
  onOpenChange,
}: {
  document: CandidateDocument | null;
  status: DocumentReviewStatus;
  onOpenChange: (open: boolean) => void;
}) {
  const verify = useVerifyDocumentMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { notes: '' },
  });

  useEffect(() => {
    if (document) reset({ notes: '' });
  }, [document, reset]);

  const submit = handleSubmit(async ({ notes }) => {
    if (!document) return;
    try {
      await verify.mutateAsync({
        id: document.id,
        data: { status, ...(notes && { notes }) },
      });
      toast.success(
        status === 'verified' ? 'Document verified' : 'Document rejected',
      );
      onOpenChange(false);
    } catch (err) {
      toast.error('Could not update document', errorMessage(err));
    }
  });

  return (
    <Dialog open={document !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === 'verified' ? 'Verify document' : 'Reject document'}
          </DialogTitle>
          <DialogDescription>{document?.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="review-notes" className="text-xs">
              Notes
            </Label>
            <Textarea
              id="review-notes"
              rows={3}
              placeholder={
                status === 'verified'
                  ? 'Checked against the original, optional'
                  : 'What is wrong with this document?'
              }
              {...register('notes')}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={status === 'verified' ? 'default' : 'destructive'}
              disabled={isSubmitting}
            >
              {status === 'verified' ? 'Verify' : 'Reject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function isExpired(date: string | null) {
  return !!date && new Date(date).getTime() < Date.now();
}

function previewKind(doc: CandidateDocument) {
  const name = doc.fileName.toLowerCase();
  if (doc.mimeType === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  return 'other';
}

export function CandidateDocumentsTab({
  candidateId,
}: {
  candidateId: string;
}) {
  const fmt = useFormatters();
  const { data: documents = [], isLoading } =
    useCandidateDocumentsQuery(candidateId);
  const downloadUrl = useDocumentDownloadUrlMutation();
  const deleteDocument = useDeleteDocumentMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [review, setReview] = useState<{
    doc: CandidateDocument;
    status: DocumentReviewStatus;
  } | null>(null);
  const [deleting, setDeleting] = useState<CandidateDocument | null>(null);

  const selected =
    documents.find((d) => d.id === selectedId) ?? documents[0] ?? null;
  const selectedUrl = selected ? urls[selected.id] : undefined;
  const { mutate: fetchUrl } = downloadUrl;

  useEffect(() => {
    if (!selected || selected.id in urls) return;
    const id = selected.id;
    setUrls((u) => ({ ...u, [id]: null }));
    fetchUrl(id, {
      onSuccess: ({ url }) => setUrls((u) => ({ ...u, [id]: url })),
      onError: (err) => {
        setUrls((u) => ({ ...u, [id]: '' }));
        toast.error('Could not load document', errorMessage(err));
      },
    });
  }, [selected, urls, fetchUrl]);

  const download = async (doc: CandidateDocument) => {
    try {
      const url = urls[doc.id] || (await downloadUrl.mutateAsync(doc.id)).url;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error('Could not download', errorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDocument.mutateAsync({ id: deleting.id, candidateId });
      toast.success('Document deleted');
      if (selectedId === deleting.id) setSelectedId(null);
    } catch (err) {
      toast.error('Could not delete document', errorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const kind = selected ? previewKind(selected) : 'other';

  return (
    <div className="flex h-[calc(100vh-8.5rem)]">
      <div className="flex w-64 shrink-0 flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {documents.length}{' '}
            {documents.length === 1 ? 'document' : 'documents'}
          </span>
          <PermissionGuard permissions={PERMISSIONS_ENUM.DOCUMENT_CREATE}>
            <ToolbarButton icon={Upload} onClick={() => setUploadOpen(true)}>
              Upload
            </ToolbarButton>
          </PermissionGuard>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {isLoading &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          {!isLoading && documents.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No documents yet
            </p>
          )}
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelectedId(doc.id)}
              className={cn(
                'w-full space-y-1 rounded-sm px-2 py-1.5 text-left text-sm',
                selected?.id === doc.id
                  ? 'bg-[#EDF1EE] dark:bg-[#3F6650]/20'
                  : 'hover:bg-accent',
              )}
            >
              <span className="flex items-center gap-2">
                <FileText
                  className={cn(
                    'h-4 w-4 shrink-0',
                    previewKind(doc) === 'pdf'
                      ? 'text-[#E0533D]'
                      : 'text-[#2B6CB0] dark:text-[#7FA8E0]',
                  )}
                />
                <span className="truncate font-medium">{doc.name}</span>
              </span>
              <span className="flex flex-wrap items-center gap-1.5 pl-6 text-[11px] text-muted-foreground">
                {DOCUMENT_TYPE_LABEL[doc.type]}
                <StatusPill tone={VERIFICATION_TONE[doc.verificationStatus]}>
                  {VERIFICATION_LABEL[doc.verificationStatus]}
                </StatusPill>
                {doc.expiresAt && (
                  <span
                    className={cn(
                      isExpired(doc.expiresAt) &&
                        'font-medium text-red-600 dark:text-red-400',
                    )}
                  >
                    {isExpired(doc.expiresAt) ? 'Expired' : 'Expires'}{' '}
                    {fmt.date(doc.expiresAt)}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        {!selected ? (
          <EmptyState
            className="flex-1"
            icon={<FileText className="h-5 w-5" />}
            title="No document selected"
            description="Upload a CV, ID, right to work or DBS document to keep it on file"
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{selected.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {DOCUMENT_TYPE_LABEL[selected.type]}
                  {selected.sizeBytes
                    ? ` · ${formatBytes(selected.sizeBytes, 1)}`
                    : ''}
                  {` · added ${fmt.date(selected.createdAt)}`}
                  {selected.verifiedAt &&
                    ` · ${VERIFICATION_LABEL[selected.verificationStatus].toLowerCase()} ${fmt.date(selected.verifiedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <PermissionGuard permissions={PERMISSIONS_ENUM.DOCUMENT_VERIFY}>
                  {selected.verificationStatus !== 'verified' && (
                    <ToolbarButton
                      icon={Check}
                      onClick={() =>
                        setReview({ doc: selected, status: 'verified' })
                      }
                    >
                      Verify
                    </ToolbarButton>
                  )}
                  {selected.verificationStatus !== 'rejected' && (
                    <ToolbarButton
                      icon={X}
                      onClick={() =>
                        setReview({ doc: selected, status: 'rejected' })
                      }
                    >
                      Reject
                    </ToolbarButton>
                  )}
                </PermissionGuard>
                <button
                  type="button"
                  onClick={() => download(selected)}
                  aria-label="Download"
                  className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Download className="h-4 w-4" />
                </button>
                {selectedUrl && (
                  <a
                    href={selectedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open in new tab"
                    className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <PermissionGuard permissions={PERMISSIONS_ENUM.DOCUMENT_DELETE}>
                  <button
                    type="button"
                    onClick={() => setDeleting(selected)}
                    aria-label="Delete"
                    className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              </div>
            </div>
            {selected.notes && (
              <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                {selected.notes}
              </p>
            )}
            <div className="min-h-0 flex-1">
              {selectedUrl === '' ? (
                <EmptyState
                  className="h-full"
                  icon={<FileText className="h-5 w-5" />}
                  title="Preview unavailable"
                />
              ) : !selectedUrl ? (
                <Skeleton className="m-4 h-[calc(100%-2rem)]" />
              ) : kind === 'pdf' ? (
                <object
                  data={`${selectedUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  type="application/pdf"
                  className="h-full w-full"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-8 w-8" />
                    <a
                      href={selectedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#3F6650] underline dark:text-[#8FBFA1]"
                    >
                      Open {selected.name}
                    </a>
                  </div>
                </object>
              ) : kind === 'docx' ? (
                <DocxViewer url={selectedUrl} />
              ) : (
                <EmptyState
                  className="h-full"
                  icon={<FileText className="h-5 w-5" />}
                  title="No preview for this file type"
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => download(selected)}
                    >
                      Download
                    </Button>
                  }
                />
              )}
            </div>
          </>
        )}
      </div>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        candidateId={candidateId}
        onUploaded={(doc) => setSelectedId(doc.id)}
      />
      <ReviewDocumentDialog
        document={review?.doc ?? null}
        status={review?.status ?? 'verified'}
        onOpenChange={(o) => !o && setReview(null)}
      />
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} will be removed from this candidate. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
