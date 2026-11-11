'use client';

import { useSyncExternalStore } from 'react';
import type { AgentConfig } from './agent-config';

export type StoredAgentStatus = 'Active' | 'Draft';

export interface StoredAgent {
  id: string;
  config: AgentConfig;
  status: StoredAgentStatus;
  enabled: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'rabbithr.agents';
const EMPTY: StoredAgent[] = [];

let cache: StoredAgent[] | null = null;
const listeners = new Set<() => void>();

function read(): StoredAgent[] {
  if (cache) return cache;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as StoredAgent[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: StoredAgent[]) {
  cache = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    cache = next;
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStoredAgents(): StoredAgent[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function getStoredAgent(id: string): StoredAgent | undefined {
  return read().find((a) => a.id === id);
}

export function saveAgent(input: {
  id?: string;
  config: AgentConfig;
  status: StoredAgentStatus;
}): StoredAgent {
  const existing = input.id ? getStoredAgent(input.id) : undefined;
  const agent: StoredAgent = {
    id: existing?.id ?? `agent-${Date.now().toString(36)}`,
    config: input.config,
    status: input.status,
    enabled: input.status === 'Active',
    updatedAt: Date.now(),
  };
  const rest = read().filter((a) => a.id !== agent.id);
  write([agent, ...rest]);
  return agent;
}

export function setAgentEnabled(id: string, enabled: boolean) {
  write(
    read().map((a) =>
      a.id === id
        ? { ...a, enabled, status: enabled ? 'Active' : a.status }
        : a,
    ),
  );
}

export function deleteAgent(id: string) {
  write(read().filter((a) => a.id !== id));
}
