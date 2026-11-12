'use client';

import { useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';

export function DocxViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    if (!el) return;
    (async () => {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        if (cancelled || !el) return;
        el.innerHTML = '';
        await renderAsync(buf, el, undefined, {
          className: 'docx',
          inWrapper: true,
          ignoreLastRenderedPageBreak: true,
        });
      } catch {
        if (el && !cancelled) {
          el.innerHTML =
            '<div class="p-6 text-sm text-muted-foreground">Could not render this document</div>';
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div ref={ref} className="h-full w-full overflow-auto bg-[#f5f5f5] p-4" />
  );
}
