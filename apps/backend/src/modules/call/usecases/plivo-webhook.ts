import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { CandidateCallEntity } from '@db/entities';
import { CandidateCallRepository } from '@db/repositories';
import {
  PlivoCallService,
  PlivoCredentials,
} from '../services/plivo-call.service';
import { verifyPlivoSignature } from '../services/plivo-signature';

export async function authenticatePlivoWebhook(
  callRepository: CandidateCallRepository,
  plivo: PlivoCallService,
  callId: string,
  req: Request,
): Promise<{ call: CandidateCallEntity; creds: PlivoCredentials }> {
  const call = await callRepository.findOne({ where: { id: callId } });
  if (!call) throw new NotFoundException('Call not found');
  const creds = await plivo.findCredentials(call.organizationId);
  const expectedUrl = `${plivo.apiUrl() ?? ''}${req.originalUrl}`;
  if (!creds || !verifyPlivoSignature(req, expectedUrl, creds.authToken)) {
    throw new ForbiddenException('Invalid Plivo signature');
  }
  return { call, creds };
}
