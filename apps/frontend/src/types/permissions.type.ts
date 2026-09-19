import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';

export type Permission =
  (typeof PERMISSIONS_ENUM)[keyof typeof PERMISSIONS_ENUM];
