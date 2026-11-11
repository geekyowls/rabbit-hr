import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CandidateCallRepository } from '@db/repositories';
import { QUEUE_NAMES } from '@modules/queue/queue.module';
import { reportJobFailure } from '@modules/queue/report-job-failure';
import { PlivoCallService } from '../services/plivo-call.service';

export interface CallRecordingJob {
  callId: string;
}

@Processor(QUEUE_NAMES.CALL_RECORDING, { concurrency: 3 })
export class CallRecordingProcessor extends WorkerHost {
  constructor(
    private readonly callRepository: CandidateCallRepository,
    private readonly plivo: PlivoCallService,
  ) {
    super();
  }

  async process(job: Job<CallRecordingJob>): Promise<void> {
    const call = await this.callRepository.findOne({
      where: { id: job.data.callId },
    });
    if (!call?.callUuid || call.recordingUrl) return;
    const creds = await this.plivo.findCredentials(call.organizationId);
    if (!creds) return;
    const recording = await this.plivo.getRecording(creds, call.callUuid);
    if (!recording) {
      throw new Error(`Recording not ready for call ${call.id}`);
    }
    await this.callRepository.update(call.id, {
      recordingUrl: recording.url,
      recordingDurationSeconds: recording.durationSeconds,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<CallRecordingJob> | undefined, err: Error): void {
    if (err.message.startsWith('Recording not ready')) return;
    reportJobFailure(job, err);
  }
}
