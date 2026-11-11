import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Request } from 'express';
import { CandidateCallEntity } from '@db/entities';
import {
  ActivityRepository,
  ApplicationRepository,
  CandidateCallRepository,
  CandidateRepository,
} from '@db/repositories';
import { ActivityType, CallDisposition, CallStatus } from '@db/enums';
import { QUEUE_NAMES } from '@modules/queue/queue.module';
import { PlivoCallService } from '../../services/plivo-call.service';
import { authenticatePlivoWebhook } from '../plivo-webhook';
import { PlivoHangupBody } from '../../dtos/call.dto';
import { CallRecordingJob } from '../../processors/call-recording.processor';

const RECORDING_DELAY_MS = 10_000;

const STATUS_MAP: Record<string, CallStatus> = {
  completed: CallStatus.COMPLETED,
  busy: CallStatus.BUSY,
  'no-answer': CallStatus.NO_ANSWER,
  timeout: CallStatus.NO_ANSWER,
  cancel: CallStatus.CANCELLED,
  cancelled: CallStatus.CANCELLED,
  failed: CallStatus.FAILED,
};

const toInt = (value?: string): number | null => {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isNaN(parsed) ? null : parsed;
};

const toDate = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

@Injectable()
export class HandlePlivoHangup {
  constructor(
    private readonly callRepository: CandidateCallRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly plivo: PlivoCallService,
    @InjectQueue(QUEUE_NAMES.CALL_RECORDING)
    private readonly recordingQueue: Queue<CallRecordingJob>,
  ) {}

  async execute(callId: string, body: PlivoHangupBody, req: Request) {
    const { call } = await authenticatePlivoWebhook(
      this.callRepository,
      this.plivo,
      callId,
      req,
    );

    const durationSeconds = toInt(body.Duration) ?? 0;
    const billDurationSeconds = toInt(body.BillDuration);
    call.callUuid = body.CallUUID ?? call.callUuid;
    call.status =
      STATUS_MAP[(body.CallStatus ?? '').toLowerCase()] ?? CallStatus.FAILED;
    call.hangupCause = body.HangupCause?.slice(0, 100) ?? null;
    call.durationSeconds = durationSeconds;
    call.billDurationSeconds = billDurationSeconds;
    call.startedAt = toDate(body.StartTime) ?? call.startedAt;
    call.endedAt = toDate(body.EndTime) ?? new Date();
    const connected =
      call.status === CallStatus.COMPLETED && (billDurationSeconds ?? 0) > 0;
    call.disposition ??= this.defaultDisposition(call.status, connected);
    await this.callRepository.save(call);

    if (!call.activityId) {
      call.activityId = await this.recordActivity(call, connected);
      await this.callRepository.save(call);
    }

    if (connected && call.callUuid) {
      await this.recordingQueue.add(
        'fetch',
        { callId: call.id },
        {
          jobId: `recording-${call.id}`,
          delay: RECORDING_DELAY_MS,
          attempts: 4,
          backoff: { type: 'exponential', delay: 20_000 },
        },
      );
    }
    return { ok: true };
  }

  private defaultDisposition(
    status: CallStatus,
    connected: boolean,
  ): CallDisposition {
    if (connected) return CallDisposition.CONNECTED;
    if (status === CallStatus.BUSY) return CallDisposition.BUSY;
    return CallDisposition.NO_ANSWER;
  }

  private async recordActivity(
    call: CandidateCallEntity,
    connected: boolean,
  ): Promise<string> {
    const [candidate, application] = await Promise.all([
      this.candidateRepository.findOne({
        where: { id: call.candidateId, organizationId: call.organizationId },
        select: ['id', 'firstName', 'lastName'],
      }),
      call.applicationId
        ? this.applicationRepository.findOne({
            where: { id: call.applicationId },
            relations: { job: true },
            select: {
              id: true,
              jobId: true,
              job: { id: true, clientId: true },
            },
          })
        : null,
    ]);
    const name = candidate
      ? `${candidate.firstName} ${candidate.lastName}`
      : 'candidate';
    const activity = await this.activityRepository.record({
      organizationId: call.organizationId,
      candidateId: call.candidateId,
      applicationId: call.applicationId,
      jobId: application?.jobId ?? null,
      clientId: application?.job?.clientId ?? null,
      type: ActivityType.CALL,
      title: connected
        ? `Call with ${name} (${formatDuration(call.durationSeconds)})`
        : `Call to ${name} not connected`,
      body: call.note,
      metadata: {
        kind: 'call',
        callId: call.id,
        status: call.status,
        disposition: call.disposition,
        durationSeconds: call.durationSeconds,
        direction: call.direction,
      },
      actorId: call.actorId,
    });
    return activity.id;
  }
}
