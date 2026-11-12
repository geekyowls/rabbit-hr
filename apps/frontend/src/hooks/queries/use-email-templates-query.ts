import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  CreateEmailTemplateRequest,
  EmailTemplate,
  EmailTemplateCategory,
  SendApplicationEmailRequest,
  SendApplicationEmailResponse,
  UpdateEmailTemplateRequest,
} from '@/types/email-template.type';
import { activitiesKeys } from './use-activities-query';

export const emailTemplatesKeys = {
  all: ['email-templates'] as const,
  list: (category?: EmailTemplateCategory) =>
    [...emailTemplatesKeys.all, 'list', category ?? 'all'] as const,
};

export function useEmailTemplatesQuery(
  category?: EmailTemplateCategory,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: emailTemplatesKeys.list(category),
    queryFn: () =>
      fetchApi<EmailTemplate[]>(API_ROUTES.EMAIL_TEMPLATES.LIST(category)),
    enabled,
  });
}

export function useCreateEmailTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmailTemplateRequest) =>
      fetchApi<EmailTemplate>(API_ROUTES.EMAIL_TEMPLATES.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailTemplatesKeys.all });
    },
  });
}

export function useUpdateEmailTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEmailTemplateRequest;
    }) =>
      fetchApi<EmailTemplate>(API_ROUTES.EMAIL_TEMPLATES.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailTemplatesKeys.all });
    },
  });
}

export function useDeleteEmailTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.EMAIL_TEMPLATES.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailTemplatesKeys.all });
    },
  });
}

export function useSendApplicationEmailMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: SendApplicationEmailRequest;
    }) =>
      fetchApi<SendApplicationEmailResponse>(
        API_ROUTES.APPLICATIONS.SEND_EMAIL(applicationId),
        { method: 'POST', body: JSON.stringify(data) },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activitiesKeys.all });
    },
  });
}
