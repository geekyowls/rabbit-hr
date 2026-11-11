import { Module } from '@nestjs/common';
import { CallController } from './call.controller';
import { PlivoWebhookController } from './plivo-webhook.controller';
import { PlivoCallService } from './services/plivo-call.service';
import { InitiateCall } from './usecases/initiate-call/initiate-call.usecase';
import { ListCandidateCalls } from './usecases/list-candidate-calls/list-candidate-calls.usecase';
import { UpdateCall } from './usecases/update-call/update-call.usecase';
import { HandlePlivoAnswer } from './usecases/handle-plivo-answer/handle-plivo-answer.usecase';
import { HandlePlivoHangup } from './usecases/handle-plivo-hangup/handle-plivo-hangup.usecase';

@Module({
  controllers: [CallController, PlivoWebhookController],
  providers: [
    PlivoCallService,
    InitiateCall,
    ListCandidateCalls,
    UpdateCall,
    HandlePlivoAnswer,
    HandlePlivoHangup,
  ],
})
export class CallModule {}
