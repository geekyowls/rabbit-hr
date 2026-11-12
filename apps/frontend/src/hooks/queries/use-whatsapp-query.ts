import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  AddWhatsappTemplateRequest,
  ListCandidateWhatsappMessagesParams,
  UpdateWhatsappTemplateMappingRequest,
  WhatsappMessage,
  WhatsappMessageRequest,
  WhatsappPlaceholder,
  WhatsappPreview,
  WhatsappTemplate,
  WhatsappTemplatesResponse,
} from '@/types/whatsapp.type';
import { activitiesKeys } from './use-activities-query';

export const whatsappKeys = {
  all: ['whatsapp'] as const,
  templates: () => [...whatsappKeys.all, 'templates'] as const,
  placeholders: () => [...whatsappKeys.all, 'placeholders'] as const,
  messages: (candidateId: string) =>
    [...whatsappKeys.all, 'messages', candidateId] as const,
  messageList: (
    candidateId: string,
    params: ListCandidateWhatsappMessagesParams,
  ) => [...whatsappKeys.messages(candidateId), params] as const,
};

export function useWhatsappTemplatesQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: whatsappKeys.templates(),
    queryFn: () =>
      fetchApi<WhatsappTemplatesResponse>(API_ROUTES.WHATSAPP.TEMPLATES),
    enabled,
  });
}

export function useWhatsappPlaceholdersQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: whatsappKeys.placeholders(),
    queryFn: () =>
      fetchApi<WhatsappPlaceholder[]>(API_ROUTES.WHATSAPP.PLACEHOLDERS),
    staleTime: Infinity,
    enabled,
  });
}

export function useCandidateWhatsappMessagesQuery(
  candidateId: string | null | undefined,
  params: ListCandidateWhatsappMessagesParams = { page: 1, limit: 10 },
) {
  return useQuery({
    queryKey: whatsappKeys.messageList(candidateId ?? '', params),
    queryFn: () =>
      fetchApi<PaginatedResponse<WhatsappMessage>>(
        API_ROUTES.WHATSAPP.CANDIDATE_MESSAGES(
          candidateId!,
          new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
          }).toString(),
        ),
      ),
    placeholderData: keepPreviousData,
    enabled: !!candidateId,
  });
}

function useTemplateMutation<TVariables, TResult>(
  request: (variables: TVariables) => Promise<TResult>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: whatsappKeys.templates() }),
  });
}

export function useSyncWhatsappTemplatesMutation() {
  return useTemplateMutation(() =>
    fetchApi<WhatsappTemplate[]>(API_ROUTES.WHATSAPP.SYNC_TEMPLATES, {
      method: 'POST',
    }),
  );
}

export function useAddWhatsappTemplateMutation() {
  return useTemplateMutation((data: AddWhatsappTemplateRequest) =>
    fetchApi<WhatsappTemplate>(API_ROUTES.WHATSAPP.TEMPLATES, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  );
}

export function useDeleteWhatsappTemplateMutation() {
  return useTemplateMutation((id: string) =>
    fetchApi<{ id: string; deleted: boolean }>(
      API_ROUTES.WHATSAPP.DELETE_TEMPLATE(id),
      { method: 'DELETE' },
    ),
  );
}

export function useUpdateWhatsappTemplateMappingMutation() {
  return useTemplateMutation(
    ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWhatsappTemplateMappingRequest;
    }) =>
      fetchApi<WhatsappTemplate>(API_ROUTES.WHATSAPP.TEMPLATE_MAPPING(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  );
}

export function usePreviewWhatsappMessageMutation() {
  return useMutation({
    mutationFn: (data: WhatsappMessageRequest) =>
      fetchApi<WhatsappPreview>(API_ROUTES.WHATSAPP.PREVIEW, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useSendWhatsappMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WhatsappMessageRequest) =>
      fetchApi<WhatsappMessage>(API_ROUTES.WHATSAPP.SEND, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (message) => {
      qc.invalidateQueries({
        queryKey: whatsappKeys.messages(message.candidateId),
      });
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
    },
  });
}
