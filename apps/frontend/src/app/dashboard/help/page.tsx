'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import {
  SUPPORT_WHATSAPP_URL,
  SUPPORT_WHATSAPP_DISPLAY,
} from '@/constants/support.constants';

export default function HelpPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-bold">Help &amp; Support</h1>
        <p className="text-sm text-muted-foreground">
          Need a hand? Reach out and we&apos;ll help you out.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Message us on WhatsApp at {SUPPORT_WHATSAPP_DISPLAY} and we&apos;ll
            get back to you.
          </p>
          <Button asChild>
            <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat on WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
