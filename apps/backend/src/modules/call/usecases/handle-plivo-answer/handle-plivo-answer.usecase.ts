import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { CandidateCallRepository } from '@db/repositories';
import { PlivoCallService } from '../../services/plivo-call.service';
import { authenticatePlivoWebhook } from '../plivo-webhook';

@Injectable()
export class HandlePlivoAnswer {
  constructor(
    private readonly callRepository: CandidateCallRepository,
    private readonly plivo: PlivoCallService,
  ) {}

  async execute(callId: string, req: Request): Promise<string> {
    const { call, creds } = await authenticatePlivoWebhook(
      this.callRepository,
      this.plivo,
      callId,
      req,
    );
    if (!call.toNumber || call.endedAt) return this.plivo.hangupXml();
    return this.plivo.answerXml(creds, call.toNumber);
  }
}
