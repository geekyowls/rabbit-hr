import { BadRequestException, Injectable } from '@nestjs/common';
import {
  generateOtp,
  addMinutes,
  EventName,
  SignupOtpRequestedEvent,
} from '@boilerplate/core';
import { UserRepository, EmailVerificationRepository } from '@db/repositories';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { SendSignupOtpCommand } from './send-signup-otp.command';

const OTP_EXPIRY_MINUTES = 10;

@Injectable()
export class SendSignupOtp {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(
    command: SendSignupOtpCommand,
  ): Promise<{ message: string; expiresIn: number }> {
    const email = command.email.toLowerCase().trim();

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const otp = generateOtp(6);
    const expiresAt = addMinutes(OTP_EXPIRY_MINUTES, new Date());

    await this.emailVerificationRepository.upsertByEmail(email, {
      otpCode: otp,
      expiresAt,
      verified: false,
      attempts: 0,
    });

    this.eventEmitter.emit<SignupOtpRequestedEvent>({
      eventName: EventName.SIGNUP_OTP_REQUESTED,
      timestamp: new Date(),
      email,
      otp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    return {
      message: 'OTP sent successfully',
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    };
  }
}
