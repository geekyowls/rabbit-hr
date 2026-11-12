import { cn } from '@/lib/utils';

export function TruncatedText({
  text,
  title,
  className,
}: {
  text: string | null | undefined;
  title?: string;
  className?: string;
}) {
  if (!text) return null;
  return (
    <span className={cn('block truncate', className)} title={title ?? text}>
      {text}
    </span>
  );
}
