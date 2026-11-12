import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationRepository,
  CandidateCallRepository,
  CandidateRepository,
} from '@db/repositories';
import { CallStatus } from '@db/enums';
import { ContextLogger } from '@shared/framework/context-logger';
import { toE164 } from '@shared/helpers/integration-credentials';
import { IntegrationCapabilitiesService } from '@modules/integration/core/integration-capabilities.service';
import { PlivoCallService } from '../../services/plivo-call.service';
import { loadCall } from '../call-query';
import { InitiateCallCommand } from './initiate-call.command';

@Injectable()
export class InitiateCall {
  private readonly logger = new ContextLogger(InitiateCall.name);

  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly callRepository: CandidateCallRepository,
    private readonly plivo: PlivoCallService,
    private readonly capabilities: IntegrationCapabilitiesService,
  ) {}

  async execute(command: InitiateCallCommand) {
    const { organizationId } = command;
    const candidate = await this.candidateRepository.findOne({
      where: { id: command.candidateId, organizationId },
      select: ['id', 'phone'],
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    await this.capabilities.require(organizationId, 'calls');
    const creds = await this.plivo.findCredentials(organizationId);
    if (!creds) throw new ConflictException('Calling is not connected');
    if (!this.plivo.apiUrl()) {
      throw new ConflictException('Calling needs API_URL to be configured');
    }

    const candidatePhone = toE164(candidate.phone);
    if (!candidatePhone) {
      throw new BadRequestException('Candidate has no phone number');
    }

    if (command.applicationId) {
      const application = await this.applicationRepository.findOne({
        where: {
          id: command.applicationId,
          organizationId,
          candidateId: candidate.id,
        },
        select: ['id'],
      });
      if (!application) {
        throw new NotFoundException('Application not found for candidate');
      }
    }

    const call = await this.callRepository.save(
      this.callRepository.create({
        organizationId,
        candidateId: candidate.id,
        applicationId: command.applicationId ?? null,
        actorId: command.userId,
        status: CallStatus.INITIATED,
        fromNumber: toE164(creds.phoneNumber),
        toNumber: candidatePhone,
        staffNumber: toE164(command.staffPhone),
      }),
    );

    try {
      call.requestUuid = await this.plivo.dialStaff(
        creds,
        command.staffPhone,
        call.id,
      );
      await this.callRepository.save(call);
    } catch (err) {
      const message = this.errorMessage(err);
      this.logger.warn(`Plivo call ${call.id} failed to start: ${message}`);
      call.status = CallStatus.FAILED;
      call.hangupCause = message.slice(0, 100);
      call.endedAt = new Date();
      await this.callRepository.save(call);
      throw new BadGatewayException(`Could not start the call: ${message}`);
    }

    return loadCall(this.callRepository, organizationId, call.id);
  }

  private errorMessage(err: unknown): string {
    const error = (err ?? {}) as {
      message?: unknown;
      status?: unknown;
      statusText?: unknown;
    };
    if (typeof error.message === 'string' && error.message) {
      return error.message;
    }
    if (typeof error.status === 'number') {
      return `Plivo returned ${error.status} ${typeof error.statusText === 'string' ? error.statusText : ''}`.trim();
    }
    return typeof err === 'string' && err ? err : 'Plivo rejected the call';
  }
}
