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
  CreateOfferRequest,
  ListOffersRequest,
  Offer,
  OfferDecisionRequest,
  RespondOfferRequest,
  UpdateOfferRequest,
  WithdrawOfferRequest,
} from '@/types/offer.type';
import { activitiesKeys } from './use-activities-query';
import { applicationsKeys } from './use-applications-query';
import { atsDashboardKeys } from './use-ats-dashboard-query';
import { candidatesKeys } from './use-candidates-query';
import { jobsKeys } from './use-jobs-query';
import { reportsKeys } from './use-reports-query';

export const offersKeys = {
  all: ['offers'] as const,
  lists: () => [...offersKeys.all, 'list'] as const,
  list: (params: ListOffersRequest) => [...offersKeys.lists(), params] as const,
  details: () => [...offersKeys.all, 'detail'] as const,
  detail: (id: string) => [...offersKeys.details(), id] as const,
};

export function useOffersQuery(
  params: ListOffersRequest,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: offersKeys.list(params),
    queryFn: () =>
      fetchApi<PaginatedResponse<Offer>>(API_ROUTES.OFFERS.LIST, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOfferQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: offersKeys.detail(id ?? ''),
    queryFn: () => fetchApi<Offer>(API_ROUTES.OFFERS.GET(id!)),
    enabled: !!id,
  });
}

function useInvalidateOffers() {
  const qc = useQueryClient();
  return (offer?: Offer, stageMayChange = false) => {
    if (offer) {
      qc.setQueryData(offersKeys.detail(offer.id), offer);
    }
    qc.invalidateQueries({ queryKey: offersKeys.lists() });
    qc.invalidateQueries({ queryKey: activitiesKeys.all });
    qc.invalidateQueries({ queryKey: atsDashboardKeys.all });
    qc.invalidateQueries({ queryKey: reportsKeys.all });
    if (stageMayChange) {
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      qc.invalidateQueries({ queryKey: candidatesKeys.all });
      qc.invalidateQueries({ queryKey: jobsKeys.all });
    }
  };
}

function useOfferAction<TVariables>(
  request: (variables: TVariables) => Promise<Offer>,
  stageMayChange = false,
) {
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: request,
    onSuccess: (offer) => invalidate(offer, stageMayChange),
  });
}

const post = <T>(url: string, body?: T) =>
  fetchApi<Offer>(url, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });

export function useCreateOfferMutation() {
  return useOfferAction((data: CreateOfferRequest) =>
    post(API_ROUTES.OFFERS.CREATE, data),
  );
}

export function useUpdateOfferMutation() {
  return useOfferAction(
    ({ id, data }: { id: string; data: UpdateOfferRequest }) =>
      fetchApi<Offer>(API_ROUTES.OFFERS.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  );
}

export function useSubmitOfferMutation() {
  return useOfferAction((id: string) => post(API_ROUTES.OFFERS.SUBMIT(id)));
}

export function useApproveOfferMutation() {
  return useOfferAction(
    ({ id, data }: { id: string; data?: OfferDecisionRequest }) =>
      post(API_ROUTES.OFFERS.APPROVE(id), data),
  );
}

export function useRejectOfferMutation() {
  return useOfferAction(
    ({ id, data }: { id: string; data?: OfferDecisionRequest }) =>
      post(API_ROUTES.OFFERS.REJECT(id), data),
  );
}

export function useSendOfferMutation() {
  return useOfferAction((id: string) => post(API_ROUTES.OFFERS.SEND(id)), true);
}

export function useRespondOfferMutation() {
  return useOfferAction(
    ({ id, data }: { id: string; data: RespondOfferRequest }) =>
      post(API_ROUTES.OFFERS.RESPOND(id), data),
    true,
  );
}

export function useWithdrawOfferMutation() {
  return useOfferAction(
    ({ id, data }: { id: string; data?: WithdrawOfferRequest }) =>
      fetchApi<Offer>(API_ROUTES.OFFERS.WITHDRAW(id), {
        method: 'PATCH',
        body: JSON.stringify(data ?? {}),
      }),
  );
}

export function useDeleteOfferMutation() {
  const qc = useQueryClient();
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(API_ROUTES.OFFERS.DELETE(id), {
        method: 'DELETE',
      }),
    onSuccess: (_result, id) => {
      qc.removeQueries({ queryKey: offersKeys.detail(id) });
      invalidate();
    },
  });
}
