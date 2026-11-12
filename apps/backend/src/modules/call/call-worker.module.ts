import { Module } from '@nestjs/common';
import { PlivoCallService } from './services/plivo-call.service';
import { CallRecordingProcessor } from './processors/call-recording.processor';

@Module({
  providers: [PlivoCallService, CallRecordingProcessor],
})
export class CallWorkerModule {}
