'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import {
  SUPPORT_WHATSAPP_URL,
  SUPPORT_WHATSAPP_DISPLAY,
} from '@/constants/support.constants';

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Help and support</h1>
        <p className="text-sm text-muted-foreground">
          Need a hand? Reach out and we will get back to you
        </p>
      </div>
      <div className="flex max-w-xl items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Chat with support</p>
            <p className="text-xs text-muted-foreground">
              WhatsApp {SUPPORT_WHATSAPP_DISPLAY}
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer">
            Open WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
