import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  reqId: string;
  userId?: string;
  email?: string;
  organizationId?: string;
  clientId?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}
