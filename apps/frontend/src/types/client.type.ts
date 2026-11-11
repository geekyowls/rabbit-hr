import type { UserSummary } from './common.type';

export type ClientStatus = 'active' | 'retired';

export const CLIENT_STATUSES: ClientStatus[] = ['active', 'retired'];

export interface ClientAddress {
  street?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
}

export interface ClientBilling {
  contactName?: string;
  email?: string;
  phone?: string;
  paymentTerms?: string;
  currency?: string;
}

export interface ClientContact {
  id: string;
  organizationId: string;
  clientId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  legalName: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: ClientAddress | null;
  billing: ClientBilling | null;
  logoUrl: string | null;
  brandColor: string | null;
  status: ClientStatus;
  notes: string | null;
  ownerId: string | null;
  owner: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListItem extends Client {
  contactCount: number;
  jobCount: number;
  openJobCount: number;
  applicationCount: number;
}

export interface ClientDetail extends ClientListItem {
  contacts: ClientContact[];
  placementCount: number;
}

export interface ListClientsRequest {
  page: number;
  limit: number;
  search?: string;
  status?: ClientStatus;
}

export interface CreateClientRequest {
  name: string;
  legalName?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: ClientAddress | null;
  billing?: ClientBilling | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  status?: ClientStatus;
  notes?: string | null;
  ownerId?: string | null;
}

export type UpdateClientRequest = Partial<CreateClientRequest>;

export interface CreateClientContactRequest {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  isPrimary?: boolean;
}

export type UpdateClientContactRequest = Partial<CreateClientContactRequest>;
