const RELOAD_KEY = 'chunk-reload-ts';
const RELOAD_COOLDOWN_MS = 10000;

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { name?: string; message?: string };
  const message = e.message ?? '';
  return (
    e.name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Loading CSS chunk [\w-]+ failed/i.test(message)
  );
}

export function recoverFromChunkError() {
  if (typeof window === 'undefined') return;
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  const now = Date.now();
  if (now - last < RELOAD_COOLDOWN_MS) return;
  sessionStorage.setItem(RELOAD_KEY, String(now));
  window.location.reload();
}

export function installChunkErrorRecovery() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') return;
  const w = window as unknown as { __chunkRecoveryInstalled?: boolean };
  if (w.__chunkRecoveryInstalled) return;
  w.__chunkRecoveryInstalled = true;

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as
        | (HTMLElement & { href?: string; src?: string })
        | null;
      if (
        target &&
        (target.tagName === 'LINK' || target.tagName === 'SCRIPT')
      ) {
        const url = target.href || target.src || '';
        if (url.includes('/_next/static/')) recoverFromChunkError();
        return;
      }
      if (isChunkLoadError(event.error)) recoverFromChunkError();
    },
    true,
  );

  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) recoverFromChunkError();
  });
}
