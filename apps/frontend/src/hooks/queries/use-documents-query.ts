import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  CandidateDocument,
  CreateCandidateDocumentRequest,
  DocumentDownloadUrl,
  VerifyDocumentRequest,
} from '@/types/document.type';
import { activitiesKeys } from './use-activities-query';
import { candidatesKeys } from './use-candidates-query';

export const documentsKeys = {
  all: ['documents'] as const,
  candidate: (candidateId: string) =>
    [...documentsKeys.all, 'candidate', candidateId] as const,
};

export function useCandidateDocumentsQuery(
  candidateId: string | null | undefined,
) {
  return useQuery({
    queryKey: documentsKeys.candidate(candidateId ?? ''),
    queryFn: () =>
      fetchApi<CandidateDocument[]>(
        API_ROUTES.CANDIDATES.DOCUMENTS(candidateId!),
      ),
    enabled: !!candidateId,
  });
}

export function useCreateCandidateDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      candidateId,
      data,
    }: {
      candidateId: string;
      data: CreateCandidateDocumentRequest;
    }) =>
      fetchApi<CandidateDocument>(
        API_ROUTES.CANDIDATES.CREATE_DOCUMENT(candidateId),
        { method: 'POST', body: JSON.stringify(data) },
      ),
    onSuccess: (document) => {
      qc.invalidateQueries({
        queryKey: documentsKeys.candidate(document.candidateId),
      });
      qc.invalidateQueries({
        queryKey: candidatesKeys.detail(document.candidateId),
      });
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
    },
  });
}

export function useVerifyDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VerifyDocumentRequest }) =>
      fetchApi<CandidateDocument>(API_ROUTES.DOCUMENTS.VERIFY(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (document) => {
      qc.invalidateQueries({
        queryKey: documentsKeys.candidate(document.candidateId),
      });
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
    },
  });
}

export function useDeleteDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; candidateId: string }) =>
      fetchApi<{ success: boolean }>(API_ROUTES.DOCUMENTS.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: (_res, { candidateId }) => {
      qc.invalidateQueries({ queryKey: documentsKeys.candidate(candidateId) });
    },
  });
}

export function useDocumentDownloadUrlMutation() {
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<DocumentDownloadUrl>(API_ROUTES.DOCUMENTS.DOWNLOAD_URL(id)),
  });
}
