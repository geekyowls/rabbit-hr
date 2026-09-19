'use client';

import { useOpenPanel } from '@openpanel/nextjs';
import { useCallback, useMemo, useRef } from 'react';

type TrackProperties = Record<string, unknown>;

interface IdentifyProperties {
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  permissionCount?: number;
  [key: string]: unknown;
}

export function useAnalytics() {
  const op = useOpenPanel();
  const opRef = useRef(op);
  opRef.current = op;

  const track = useCallback(
    (eventName: string, properties?: TrackProperties) => {
      if (!opRef.current) return;
      opRef.current.track(eventName, {
        timestamp: new Date().toISOString(),
        ...properties,
      });
    },
    [],
  );

  const identify = useCallback(
    (userId: string, properties?: IdentifyProperties) => {
      if (!opRef.current) return;
      opRef.current.identify({
        profileId: userId,
        email: properties?.email,
        firstName: properties?.firstName,
        lastName: properties?.lastName,
        properties: {
          organizationId: properties?.organizationId,
          permissionCount: properties?.permissionCount,
          ...properties,
        },
      });
    },
    [],
  );

  const setGlobalProperties = useCallback((properties: TrackProperties) => {
    if (!opRef.current) return;
    opRef.current.setGlobalProperties(properties);
  }, []);

  const clearIdentity = useCallback(() => {
    if (!opRef.current) return;
    opRef.current.clear();
  }, []);

  const makeTracker = useCallback(
    (prefix: string) => (action: string, properties?: TrackProperties) =>
      track(`${prefix}.${action.toLowerCase()}`, properties),
    [track],
  );

  const trackAuthEvent = useMemo(() => makeTracker('auth'), [makeTracker]);
  const trackFeatureEvent = useMemo(
    () => makeTracker('feature'),
    [makeTracker],
  );
  const trackSettingsEvent = useMemo(
    () => makeTracker('settings'),
    [makeTracker],
  );
  const trackRoleEvent = useMemo(() => makeTracker('role'), [makeTracker]);
  const trackUserEvent = useMemo(() => makeTracker('user'), [makeTracker]);

  return useMemo(
    () => ({
      track,
      identify,
      setGlobalProperties,
      clearIdentity,
      trackAuthEvent,
      trackFeatureEvent,
      trackSettingsEvent,
      trackRoleEvent,
      trackUserEvent,
    }),
    [
      track,
      identify,
      setGlobalProperties,
      clearIdentity,
      trackAuthEvent,
      trackFeatureEvent,
      trackSettingsEvent,
      trackRoleEvent,
      trackUserEvent,
    ],
  );
}
