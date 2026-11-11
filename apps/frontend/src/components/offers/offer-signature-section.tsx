'use client';

import { ExternalLink, PenLine } from 'lucide-react';
import {
  PanelSection,
  StatusPill,
  ToolbarButton,
  type PillTone,
} from '@/components/patterns';
import { CopyButton } from '@/components/comms/copy-button';
import { useFormatters } from '@/hooks/use-formatters';
import type { Offer, OfferSignStatus } from '@/types/offer.type';

const SIGN_STATUS_LABEL: Record<OfferSignStatus, string> = {
  not_sent: 'Not sent',
  pending: 'Awaiting signature',
  signed: 'Signed',
  accepted: 'Accepted without e-signature',
  declined: 'Declined',
  expired: 'Link expired',
  closed: 'Closed',
};

const SIGN_STATUS_TONE: Record<OfferSignStatus, PillTone> = {
  not_sent: 'neutral',
  pending: 'warning',
  signed: 'success',
  accepted: 'success',
  declined: 'danger',
  expired: 'neutral',
  closed: 'neutral',
};

const SIGN_STATUS_HELP: Record<OfferSignStatus, string> = {
  not_sent:
    'When you send the offer, the candidate gets a secure link to review the letter and sign by typing their full name.',
  pending:
    'The candidate reviews the letter and signs by typing their full name. You can still record their answer manually.',
  signed:
    'The candidate signed by typing their full name. The signature is stored with the letter they saw.',
  accepted:
    'The offer was marked accepted by your team, so the signing link is closed.',
  declined: 'The candidate declined the offer.',
  expired:
    'The signing link has expired. Withdraw and create a new offer to send a fresh link.',
  closed: 'The signing link is closed because the offer is no longer open.',
};

export function OfferSignatureSection({ offer }: { offer: Offer }) {
  const fmt = useFormatters();
  const signature = offer.signature;
  const status = signature.status;

  return (
    <PanelSection title="E-signature">
      <div className="space-y-3 rounded-md border border-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-muted-foreground" />
            <StatusPill tone={SIGN_STATUS_TONE[status]} dot>
              {SIGN_STATUS_LABEL[status]}
            </StatusPill>
          </div>
          {status === 'pending' && signature.expiresAt && (
            <span className="text-xs text-muted-foreground">
              Link expires {fmt.dateTime(signature.expiresAt)}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {SIGN_STATUS_HELP[status]}
        </p>

        {status === 'signed' && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Signed as</dt>
              <dd className="font-medium">{signature.signedName ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Signed at</dt>
              <dd className="font-medium">
                {signature.signedAt ? fmt.dateTime(signature.signedAt) : '-'}
              </dd>
            </div>
            {signature.signedIp && (
              <div>
                <dt className="text-xs text-muted-foreground">IP address</dt>
                <dd className="font-mono text-xs">{signature.signedIp}</dd>
              </div>
            )}
            {signature.signatureHash && (
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  Signature fingerprint
                </dt>
                <dd
                  className="truncate font-mono text-xs"
                  title={signature.signatureHash}
                >
                  {signature.signatureHash}
                </dd>
              </div>
            )}
          </dl>
        )}

        {status === 'pending' && signature.signUrl && (
          <div className="flex flex-wrap gap-2">
            <CopyButton value={signature.signUrl} label="Copy signing link" />
            <a
              href={signature.signUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ToolbarButton icon={ExternalLink}>Open link</ToolbarButton>
            </a>
          </div>
        )}
      </div>
    </PanelSection>
  );
}
