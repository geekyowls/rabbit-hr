import { useQueries } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { offersKeys } from '@/hooks/queries';
import type { PaginatedResponse } from '@/types/common.type';
import type { ListOffersRequest, Offer, OfferStatus } from '@/types/offer.type';
import { OFFER_STATUSES } from './offer-meta';

export type OfferStatusCounts = Partial<Record<OfferStatus, number>>;

export function useOfferStatusCounts(
  filters: Omit<ListOffersRequest, 'page' | 'limit' | 'status'>,
): OfferStatusCounts {
  return useQueries({
    queries: OFFER_STATUSES.map((status) => {
      const params: ListOffersRequest = {
        ...filters,
        page: 1,
        limit: 1,
        status,
      };
      return {
        queryKey: offersKeys.list(params),
        queryFn: () =>
          fetchApi<PaginatedResponse<Offer>>(API_ROUTES.OFFERS.LIST, {
            method: 'POST',
            body: JSON.stringify(params),
          }),
        staleTime: 30_000,
      };
    }),
    combine: (results) =>
      Object.fromEntries(
        OFFER_STATUSES.flatMap((status, i) => {
          const total = results[i].data?.total;
          return total === undefined ? [] : [[status, total]];
        }),
      ) as OfferStatusCounts,
  });
}
