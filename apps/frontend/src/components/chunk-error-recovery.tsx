'use client';

import { useEffect } from 'react';
import { installChunkErrorRecovery } from '@/lib/chunk-reload';

export function ChunkErrorRecovery() {
  useEffect(() => {
    installChunkErrorRecovery();
  }, []);
  return null;
}
