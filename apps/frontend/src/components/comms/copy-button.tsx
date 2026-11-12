'use client';

import { Copy } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ToolbarButton } from '@/components/patterns';

export async function copyText(value: string, success = 'Link copied') {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(success);
  } catch {
    toast.error('Could not copy', 'Select the text and copy it manually');
  }
}

export function CopyButton({
  value,
  label = 'Copy link',
  success,
}: {
  value: string;
  label?: string;
  success?: string;
}) {
  return (
    <ToolbarButton icon={Copy} onClick={() => copyText(value, success)}>
      {label}
    </ToolbarButton>
  );
}
