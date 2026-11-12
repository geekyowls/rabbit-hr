import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as plivo from 'plivo';
import { OrganizationIntegrationRepository } from '@db/repositories';
import { ContextLogger } from '@shared/framework/context-logger';
import {
  findConnectedCredentials,
  toE164,
} from '@shared/helpers/integration-credentials';

export const PLIVO_PROVIDER = 'plivo';

export interface PlivoCredentials {
  authId: string;
  authToken: string;
  phoneNumber: string;
}

export interface CallRecording {
  url: string;
  durationSeconds: number;
}

@Injectable()
export class PlivoCallService {
  private readonly logger = new ContextLogger(PlivoCallService.name);

  constructor(
    private readonly integrations: OrganizationIntegrationRepository,
    private readonly config: ConfigService,
  ) {}

  async findCredentials(
    organizationId: string,
  ): Promise<PlivoCredentials | null> {
    const creds = await findConnectedCredentials<Partial<PlivoCredentials>>(
      this.integrations,
      this.config,
      organizationId,
      PLIVO_PROVIDER,
    );
    if (!creds?.authId || !creds.authToken || !creds.phoneNumber) return null;
    return {
      authId: creds.authId,
      authToken: creds.authToken,
      phoneNumber: creds.phoneNumber,
    };
  }

  apiUrl(): string | null {
    const url = this.config.get<string>('API_URL');
    return url ? url.replace(/\/+$/, '') : null;
  }

  webhookUrl(callId: string, event: 'answer' | 'hangup'): string {
    return `${this.apiUrl()}/api/v1/public/plivo/calls/${callId}/${event}`;
  }

  async dialStaff(
    creds: PlivoCredentials,
    staffPhone: string,
    callId: string,
  ): Promise<string> {
    const client = new plivo.Client(creds.authId, creds.authToken);
    const response = await client.calls.create(
      toE164(creds.phoneNumber)!,
      toE164(staffPhone)!,
      this.webhookUrl(callId, 'answer'),
      {
        answerMethod: 'POST',
        hangupUrl: this.webhookUrl(callId, 'hangup'),
        hangupMethod: 'POST',
        callerName: 'RabbitHR',
        timeLimit: 3600,
      },
    );
    const uuid = Array.isArray(response.requestUuid)
      ? response.requestUuid[0]
      : response.requestUuid;
    return String(uuid);
  }

  answerXml(creds: PlivoCredentials, candidatePhone: string): string {
    const response = plivo.Response();
    response.addRecord({
      startOnDialAnswer: 'true',
      redirect: 'false',
      maxLength: '3600',
      fileFormat: 'mp3',
    });
    const dial = response.addDial({ callerId: toE164(creds.phoneNumber)! });
    dial.addNumber(toE164(candidatePhone)!);
    return response.toXML();
  }

  hangupXml(): string {
    return '<Response><Hangup/></Response>';
  }

  async getRecording(
    creds: PlivoCredentials,
    callUuid: string,
  ): Promise<CallRecording | null> {
    try {
      const client = new plivo.Client(creds.authId, creds.authToken);
      const recordings = (await client.recordings.list({
        callUuid,
      })) as unknown as Array<{
        recordingUrl: string;
        recordingDurationMs: string;
      }>;
      const first = Array.isArray(recordings) ? recordings[0] : null;
      if (!first) return null;
      return {
        url: first.recordingUrl,
        durationSeconds: Math.round(
          parseInt(first.recordingDurationMs, 10) / 1000,
        ),
      };
    } catch (err) {
      this.logger.warn(
        `Plivo recording lookup failed for ${callUuid}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
