'use client';

import { useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { useTheme } from 'next-themes';

const FRAME_STYLE = (dark: boolean) => `
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.55;
    color: ${dark ? '#e4e4e7' : '#18181b'};
    background: transparent;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  a { color: ${dark ? '#8FBFA1' : '#3F6650'}; }
  img { max-width: 100%; height: auto; }
  p { margin: 0 0 0.75em; }
  blockquote { margin: 0.5em 0; padding-left: 0.75em; border-left: 2px solid ${dark ? '#3f3f46' : '#d4d4d8'}; color: ${dark ? '#a1a1aa' : '#52525b'}; }
  pre { white-space: pre-wrap; }
  table { max-width: 100%; }
`;

export function MessageBody({
  html,
  text,
}: {
  html: string | null;
  text: string | null;
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(80);

  const srcDoc = useMemo(() => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    });
    return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>${FRAME_STYLE(dark)}</style></head><body>${clean}</body></html>`;
  }, [html, dark]);

  if (!srcDoc) {
    return (
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {text || ''}
      </div>
    );
  }

  const resize = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    setHeight(Math.max(40, doc.documentElement.scrollHeight + 4));
  };

  return (
    <iframe
      ref={frameRef}
      title="Email message"
      srcDoc={srcDoc}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      onLoad={resize}
      className="w-full border-0 bg-transparent"
      style={{ height }}
    />
  );
}
