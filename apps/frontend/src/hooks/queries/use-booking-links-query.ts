import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES, buildApiUrl } from '@/config/api-routes';
import { ApiError } from '@/utils/error-class';
import type {
  BookingLink,
  BookSlotRequest,
  CancelPublicBookingRequest,
  CreateBookingLinkRequest,
  CreateBookingLinkResponse,
  ListBookingLinksParams,
  PublicBookingLink,
  PublicSlots,
  PublicSlotsParams,
} from '@/types/booking-link.type';
import { activitiesKeys } from './use-activities-query';

export const bookingLinksKeys = {
  all: ['booking-links'] as const,
  list: (params: ListBookingLinksParams) =>
    [...bookingLinksKeys.all, 'list', params] as const,
};

export const publicBookingKeys = {
  all: ['public-booking'] as const,
  details: (token: string) =>
    [...publicBookingKeys.all, token, 'details'] as const,
  slots: (token: string, params: PublicSlotsParams) =>
    [...publicBookingKeys.all, token, 'slots', params] as const,
};

function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  return search.toString();
}

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

export function useBookingLinksQuery(
  params: ListBookingLinksParams,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: bookingLinksKeys.list(params),
    queryFn: () =>
      fetchApi<BookingLink[]>(
        API_ROUTES.INTERVIEW_BOOKING_LINKS.LIST(toQuery(params)),
      ),
    enabled,
  });
}

function useInvalidateBookingLinks() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: bookingLinksKeys.all });
    qc.invalidateQueries({ queryKey: activitiesKeys.all });
  };
}

export function useCreateBookingLinkMutation() {
  const invalidate = useInvalidateBookingLinks();
  return useMutation({
    mutationFn: (data: CreateBookingLinkRequest) =>
      fetchApi<CreateBookingLinkResponse>(
        API_ROUTES.INTERVIEW_BOOKING_LINKS.CREATE,
        { method: 'POST', body: JSON.stringify(data) },
      ),
    onSuccess: invalidate,
  });
}

export function useCancelBookingLinkMutation() {
  const invalidate = useInvalidateBookingLinks();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<BookingLink>(API_ROUTES.INTERVIEW_BOOKING_LINKS.CANCEL(id), {
        method: 'PATCH',
      }),
    onSuccess: invalidate,
  });
}

export function usePublicBookingQuery(token: string | null | undefined) {
  return useQuery({
    queryKey: publicBookingKeys.details(token ?? ''),
    queryFn: () =>
      publicRequest<PublicBookingLink>(
        API_ROUTES.PUBLIC_INTERVIEW_BOOKING.DETAILS(token!),
      ),
    enabled: !!token,
    retry: false,
  });
}

export function usePublicBookingSlotsQuery(
  token: string | null | undefined,
  params: PublicSlotsParams,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: publicBookingKeys.slots(token ?? '', params),
    queryFn: () =>
      publicRequest<PublicSlots>(
        API_ROUTES.PUBLIC_INTERVIEW_BOOKING.SLOTS(token!, toQuery(params)),
      ),
    enabled: !!token && enabled,
  });
}

export function useBookPublicSlotMutation(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BookSlotRequest) =>
      publicRequest<PublicBookingLink>(
        API_ROUTES.PUBLIC_INTERVIEW_BOOKING.BOOK(token),
        { method: 'POST', body: JSON.stringify(data) },
      ),
    onSuccess: (link) => {
      qc.setQueryData(publicBookingKeys.details(token), link);
      qc.invalidateQueries({ queryKey: [...publicBookingKeys.all, token] });
    },
  });
}

export function useCancelPublicBookingMutation(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CancelPublicBookingRequest = {}) =>
      publicRequest<PublicBookingLink>(
        API_ROUTES.PUBLIC_INTERVIEW_BOOKING.CANCEL(token),
        { method: 'POST', body: JSON.stringify(data) },
      ),
    onSuccess: (link) => {
      qc.setQueryData(publicBookingKeys.details(token), link);
    },
  });
}
