'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES, buildApiUrl } from '@/config/api-routes';
import { toast } from '@/lib/toast';
import type {
  IntegrationListItem,
  SaveCredentialsResponse,
} from '@/types/integration.type';

interface ProviderFieldConfig {
  name: 'apiKey' | 'authId' | 'authToken' | 'phoneNumber';
  label: string;
  placeholder: string;
  type?: 'text' | 'password';
}

const PROVIDER_FIELDS: Record<string, ProviderFieldConfig[]> = {
  openai: [
    {
      name: 'apiKey',
      label: 'API key',
      placeholder: 'sk-...',
      type: 'password',
    },
  ],
  gemini: [
    {
      name: 'apiKey',
      label: 'API key',
      placeholder: 'AIza...',
      type: 'password',
    },
  ],
  plivo: [
    {
      name: 'authId',
      label: 'Auth ID',
      placeholder: 'MA...',
      type: 'text',
    },
    {
      name: 'authToken',
      label: 'Auth token',
      placeholder: 'Your Plivo auth token',
      type: 'password',
    },
    {
      name: 'phoneNumber',
      label: 'Plivo phone number (caller ID)',
      placeholder: '+919876543210',
      type: 'text',
    },
  ],
  razorpay: [
    {
      name: 'authId',
      label: 'Key ID',
      placeholder: 'rzp_live_...',
      type: 'text',
    },
    {
      name: 'authToken',
      label: 'Key Secret',
      placeholder: 'Your Razorpay key secret',
      type: 'password',
    },
  ],
};

const RAZORPAY_WEBHOOK_STEPS = [
  'In your Razorpay Dashboard, go to Settings -> Webhooks -> Add New Webhook.',
  'Paste the Webhook URL and Signing Secret above into their matching fields.',
  'Select the "payment_link.paid" event and save on Razorpay.',
];

interface Props {
  integration: IntegrationListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ApiKeyConnectionDialog({
  integration,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [webhookToken, setWebhookToken] = useState<string | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'secret' | null>(null);

  const isRazorpay = integration?.provider === 'razorpay';

  useEffect(() => {
    if (!open) {
      setValues({});
      setSubmitting(false);
      setGenerating(false);
      setWebhookToken(null);
      setWebhookSecret(null);
      setCopiedField(null);
    }
  }, [open]);

  if (!integration) return null;

  const handleGenerateWebhook = async () => {
    setGenerating(true);
    try {
      const res = await fetchApi<{
        webhookToken: string;
        webhookSecret: string;
      }>(API_ROUTES.INTEGRATIONS.RAZORPAY_WEBHOOK_TOKEN, { method: 'POST' });
      setWebhookToken(res.webhookToken);
      setWebhookSecret(res.webhookSecret);
      onSaved();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate webhook secret';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const fields = PROVIDER_FIELDS[integration.provider] ?? [];
  const webhookUrl = webhookToken
    ? buildApiUrl(API_ROUTES.INTEGRATIONS.RAZORPAY_WEBHOOK(webhookToken))
    : null;
  const credentialsRequired = !(isRazorpay && integration.isConnected);

  const handleCopy = async (field: 'url' | 'secret', text: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await fetchApi<SaveCredentialsResponse>(
        API_ROUTES.INTEGRATIONS.CREDENTIALS(integration.provider),
        {
          method: 'POST',
          body: JSON.stringify(values),
        },
      );

      if (result.status === 'connected') {
        toast.success(`${integration.name} connected`);
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(
          result.errorMessage ||
            `${integration.name} health check failed. Please verify your credentials.`,
        );
        onSaved();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save credentials';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCopyRow = (
    label: string,
    field: 'url' | 'secret',
    value: string | null,
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={value ?? 'Generating...'}
          className="font-mono text-xs"
          onFocus={(e) => e.target.select()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => handleCopy(field, value)}
          disabled={!value}
          aria-label={`Copy ${label}`}
        >
          {copiedField === field ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect {integration.name}</DialogTitle>
            <DialogDescription>
              Enter your credentials below. We&apos;ll verify them before
              saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type={field.type ?? 'text'}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.name]: e.target.value,
                    }))
                  }
                  autoComplete="off"
                  required={credentialsRequired}
                />
              </div>
            ))}

            {isRazorpay && (
              <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                {webhookToken && webhookSecret ? (
                  <>
                    {renderCopyRow('Webhook URL', 'url', webhookUrl)}
                    {renderCopyRow('Signing secret', 'secret', webhookSecret)}

                    <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      {RAZORPAY_WEBHOOK_STEPS.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Optional: set up a payment webhook so Razorpay notifies us
                      when a payment link is paid.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateWebhook}
                      disabled={generating}
                    >
                      {generating
                        ? 'Generating...'
                        : integration.webhookToken
                          ? 'Show webhook URL & secret'
                          : 'Generate webhook secret'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
