import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FILE_EXTENSION_TO_MIME_TYPE } from '@boilerplate/shared';
import { API_ROUTES } from '@/config/api-routes';
import { fetchApi } from '@/utils/api-client';
import { fetchPortalApi, publicPortalRequest } from '@/utils/portal-api-client';
import { candidatesKeys } from './use-candidates-query';
import { activitiesKeys } from './use-activities-query';
import type {
  CreatePortalDocumentRequest,
  PortalApplication,
  PortalApplicationDetail,
  PortalAuthResponse,
  PortalBranding,
  PortalDocument,
  PortalDocuments,
  PortalInterviews,
  PortalInviteResponse,
  PortalMe,
  PortalOffer,
  PortalOtpRequested,
  PortalOverview,
  PortalProfile,
  PortalUploadExtension,
  PortalUploadUrlResponse,
  UpdatePortalProfileRequest,
} from '@/types/portal.type';

export const portalKeys = {
  all: ['portal'] as const,
  branding: (orgSlug: string) =>
    [...portalKeys.all, 'branding', orgSlug] as const,
  me: () => [...portalKeys.all, 'me'] as const,
  overview: () => [...portalKeys.all, 'overview'] as const,
  applications: () => [...portalKeys.all, 'applications'] as const,
  application: (id: string) =>
    [...portalKeys.applications(), 'detail', id] as const,
  interviews: () => [...portalKeys.all, 'interviews'] as const,
  offers: () => [...portalKeys.all, 'offers'] as const,
  documents: () => [...portalKeys.all, 'documents'] as const,
};

export function usePortalBrandingQuery(orgSlug: string | null | undefined) {
  return useQuery({
    queryKey: portalKeys.branding(orgSlug ?? ''),
    queryFn: () =>
      publicPortalRequest<PortalBranding>(API_ROUTES.PORTAL.BRANDING(orgSlug!)),
    enabled: !!orgSlug,
    retry: false,
  });
}

export function useRequestPortalOtpMutation() {
  return useMutation({
    mutationFn: ({ orgSlug, email }: { orgSlug: string; email: string }) =>
      publicPortalRequest<PortalOtpRequested>(
        API_ROUTES.PORTAL.REQUEST_OTP(orgSlug),
        { method: 'POST', body: JSON.stringify({ email }) },
      ),
  });
}

export function useVerifyPortalOtpMutation() {
  return useMutation({
    mutationFn: ({
      orgSlug,
      email,
      code,
    }: {
      orgSlug: string;
      email: string;
      code: string;
    }) =>
      publicPortalRequest<PortalAuthResponse>(
        API_ROUTES.PORTAL.VERIFY_OTP(orgSlug),
        { method: 'POST', body: JSON.stringify({ email, code }) },
      ),
  });
}

export function usePortalMeQuery(enabled = true) {
  return useQuery({
    queryKey: portalKeys.me(),
    queryFn: () => fetchPortalApi<PortalMe>(API_ROUTES.PORTAL.ME),
    enabled,
    retry: false,
  });
}

export function usePortalOverviewQuery() {
  return useQuery({
    queryKey: portalKeys.overview(),
    queryFn: () => fetchPortalApi<PortalOverview>(API_ROUTES.PORTAL.OVERVIEW),
  });
}

export function usePortalApplicationsQuery() {
  return useQuery({
    queryKey: portalKeys.applications(),
    queryFn: () =>
      fetchPortalApi<PortalApplication[]>(API_ROUTES.PORTAL.APPLICATIONS),
  });
}

export function usePortalApplicationQuery(id: string | null) {
  return useQuery({
    queryKey: portalKeys.application(id ?? ''),
    queryFn: () =>
      fetchPortalApi<PortalApplicationDetail>(
        API_ROUTES.PORTAL.APPLICATION(id!),
      ),
    enabled: !!id,
  });
}

export function useWithdrawPortalApplicationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      fetchPortalApi<PortalApplication>(API_ROUTES.PORTAL.WITHDRAW(id), {
        method: 'POST',
        body: JSON.stringify({ reason: reason || undefined }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: portalKeys.all }),
  });
}

export function usePortalInterviewsQuery() {
  return useQuery({
    queryKey: portalKeys.interviews(),
    queryFn: () =>
      fetchPortalApi<PortalInterviews>(API_ROUTES.PORTAL.INTERVIEWS),
  });
}

export function usePortalOffersQuery() {
  return useQuery({
    queryKey: portalKeys.offers(),
    queryFn: () => fetchPortalApi<PortalOffer[]>(API_ROUTES.PORTAL.OFFERS),
  });
}

export function usePortalDocumentsQuery() {
  return useQuery({
    queryKey: portalKeys.documents(),
    queryFn: () => fetchPortalApi<PortalDocuments>(API_ROUTES.PORTAL.DOCUMENTS),
  });
}

export function useUploadPortalDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      extension,
      data,
    }: {
      file: File;
      extension: PortalUploadExtension;
      data: Omit<CreatePortalDocumentRequest, 'fileKey' | 'fileName'>;
    }) => {
      const { signedUrl, key } = await fetchPortalApi<PortalUploadUrlResponse>(
        API_ROUTES.PORTAL.UPLOAD_URL,
        {
          method: 'POST',
          body: JSON.stringify({ extension, sizeBytes: file.size }),
        },
      );
      const upload = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': FILE_EXTENSION_TO_MIME_TYPE[extension] },
      });
      if (!upload.ok) throw new Error('Upload failed, please try again');
      return fetchPortalApi<PortalDocument>(API_ROUTES.PORTAL.DOCUMENTS, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          fileKey: key,
          fileName: file.name,
          sizeBytes: file.size,
        }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: portalKeys.all }),
  });
}

export function portalDocumentUrl(id: string) {
  return fetchPortalApi<{ url: string }>(
    API_ROUTES.PORTAL.DOCUMENT_DOWNLOAD(id),
  );
}

export function useUpdatePortalProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePortalProfileRequest) =>
      fetchPortalApi<PortalProfile>(API_ROUTES.PORTAL.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: portalKeys.me() }),
  });
}

export function useInviteToPortalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (candidateId: string) =>
      fetchApi<PortalInviteResponse>(API_ROUTES.PORTAL.INVITE(candidateId), {
        method: 'POST',
      }),
    onSuccess: (_data, candidateId) => {
      qc.invalidateQueries({ queryKey: candidatesKeys.detail(candidateId) });
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
    },
  });
}
