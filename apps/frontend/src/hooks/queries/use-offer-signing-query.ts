import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, buildApiUrl } from '@/config/api-routes';
import { ApiError } from '@/utils/error-class';
import type {
  AcceptOfferSigningRequest,
  DeclineOfferSigningRequest,
  PublicOfferSigning,
} from '@/types/offer.type';

async function publicRequest<T>(route: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(route), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message[0]
      : body?.message;
    throw new ApiError(message || 'Request failed', response.status);
  }
  return body.data as T;
}

export const offerSigningKeys = {
  all: ['offer-signing'] as const,
  detail: (token: string) => [...offerSigningKeys.all, token] as const,
};

export function useOfferSigningQuery(token: string | null | undefined) {
  return useQuery({
    queryKey: offerSigningKeys.detail(token ?? ''),
    queryFn: () =>
      publicRequest<PublicOfferSigning>(
        API_ROUTES.PUBLIC_OFFER_SIGN.GET(token!),
      ),
    enabled: !!token,
    retry: false,
  });
}

function useSigningMutation<TBody>(route: (token: string) => string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: TBody }) =>
      publicRequest<PublicOfferSigning>(route(token), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (view, { token }) =>
      qc.setQueryData(offerSigningKeys.detail(token), view),
  });
}

export function useAcceptOfferSigningMutation() {
  return useSigningMutation<AcceptOfferSigningRequest>(
    API_ROUTES.PUBLIC_OFFER_SIGN.ACCEPT,
  );
}

export function useDeclineOfferSigningMutation() {
  return useSigningMutation<DeclineOfferSigningRequest>(
    API_ROUTES.PUBLIC_OFFER_SIGN.DECLINE,
  );
}
