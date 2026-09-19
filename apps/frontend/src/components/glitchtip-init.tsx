'use client';

import { useEffect } from 'react';
import { initGlitchtip } from '@/lib/glitchtip';

export function GlitchtipInit() {
  useEffect(() => {
    initGlitchtip();
  }, []);
  return null;
}
