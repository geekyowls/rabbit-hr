import * as crypto from 'crypto';
import type { EmailParticipant } from '@db/entities';

export interface MimeMessageInput {
  from: EmailParticipant;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  bcc: EmailParticipant[];
  subject: string;
  html: string;
  text: string;
  inReplyTo: string | null;
  references: string | null;
}

function encodeWord(value: string): string {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function formatAddress(participant: EmailParticipant): string {
  if (!participant.name) return participant.email;
  const name = participant.name.replace(/["\\\r\n]/g, '');
  const display = /^[\x20-\x7e]*$/.test(name) ? `"${name}"` : encodeWord(name);
  return `${display} <${participant.email}>`;
}

function stripLineBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, ' ');
}

function encodeBody(value: string): string {
  return (
    Buffer.from(value, 'utf8')
      .toString('base64')
      .match(/.{1,76}/g)
      ?.join('\r\n') ?? ''
  );
}

export function buildMimeMessage(input: MimeMessageInput): string {
  const boundary = `rabbithr_${crypto.randomBytes(12).toString('hex')}`;
  const headers = [
    `From: ${formatAddress(input.from)}`,
    `To: ${input.to.map(formatAddress).join(', ')}`,
    input.cc.length ? `Cc: ${input.cc.map(formatAddress).join(', ')}` : null,
    input.bcc.length ? `Bcc: ${input.bcc.map(formatAddress).join(', ')}` : null,
    `Subject: ${encodeWord(stripLineBreaks(input.subject))}`,
    input.inReplyTo ? `In-Reply-To: ${stripLineBreaks(input.inReplyTo)}` : null,
    input.references
      ? `References: ${stripLineBreaks(input.references)}`
      : null,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter((header): header is string => header !== null);

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBody(input.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBody(input.html),
    `--${boundary}--`,
  ];

  return Buffer.from([...headers, '', ...body].join('\r\n'), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
