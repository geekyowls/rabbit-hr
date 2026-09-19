import { Permission } from './permissions.type';

export enum UserStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  organizationId: string;
  tourCompleted?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isSystemOrg?: boolean;
  canUseDemoScreens?: boolean;
  coBrandingEnabled?: boolean;
  coBrandingOrder?: 'rabbithr-first' | 'partner-first' | 'partner-only';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  permissions: Permission[];
  firstName?: string;
  lastName?: string | null;
  impersonatedBy?: string;
  exp?: number;
  iat?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isSystemOrg: boolean;
}

export interface GoogleLoginResponse extends LoginResponse {
  isNewUser: boolean;
}

export interface UserDropdown {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface HierarchyUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  managerId: string | null;
  role: { id: string; name: string } | null;
  status: string;
}

export const getFullName = (user: {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
}): string => {
  const first = user.firstName ?? '';
  const last = user.lastName ?? '';
  return last ? `${first} ${last}` : first;
};
