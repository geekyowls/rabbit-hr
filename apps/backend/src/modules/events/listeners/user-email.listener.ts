import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  MailService,
  buildUserInviteEmail,
  buildPasswordResetEmail,
  buildWelcomeEmail,
  buildSignupOtpEmail,
  buildSignupWaitlistEmail,
  buildUserCredentialsEmail,
  buildAdminPasswordResetEmail,
  EventName,
} from '@boilerplate/core';
import * as Events from '@boilerplate/core';
import { UserRepository } from '@db/repositories';

@Injectable()
export class UserEmailListener {
  private readonly logger = new Logger(UserEmailListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent(EventName.USER_INVITED, { async: true })
  async handleUserInvited(event: Events.UserInvitedEvent): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
        relations: { organization: true, inviter: true },
      });

      if (!user) {
        this.logger.warn(`User ${event.userId} not found for invitation email`);
        return;
      }

      const inviterName = user.inviter
        ? `${user.inviter.firstName || ''} ${user.inviter.lastName || ''}`.trim() ||
          user.inviter.email
        : 'Someone';

      const email = buildUserInviteEmail({
        userName: user.firstName || user.email.split('@')[0],
        inviterName,
        organizationName: user.organization?.name || 'the platform',
        inviteLink: event.inviteLink,
        email: user.email,
        expiryHours: 24,
      });

      await this.mailService.sendEmail({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(`Invitation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email for user ${event.userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent(EventName.USER_INVITE_RESENT, { async: true })
  async handleUserInviteResent(
    event: Events.UserInviteResentEvent,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
        relations: { organization: true, inviter: true },
      });

      if (!user) {
        this.logger.warn(
          `User ${event.userId} not found for resend invite email`,
        );
        return;
      }

      const inviterName = user.inviter
        ? `${user.inviter.firstName || ''} ${user.inviter.lastName || ''}`.trim() ||
          user.inviter.email
        : 'Someone';

      const email = buildUserInviteEmail({
        userName: user.firstName || user.email.split('@')[0],
        inviterName,
        organizationName: user.organization?.name || 'the platform',
        inviteLink: event.inviteLink,
        email: user.email,
        expiryHours: 24,
      });

      await this.mailService.sendEmail({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(`Resend invitation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to resend invitation email for user ${event.userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent(EventName.USER_INVITE_ACCEPTED, { async: true })
  async handleUserInviteAccepted(
    event: Events.UserInviteAcceptedEvent,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
        relations: { organization: true },
      });

      if (!user) {
        this.logger.warn(`User ${event.userId} not found for welcome email`);
        return;
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_BASE_URL');

      const email = buildWelcomeEmail({
        userName: user.firstName || user.email.split('@')[0],
        organizationName: user.organization?.name || 'the platform',
        loginUrl: frontendUrl || undefined,
      });

      await this.mailService.sendEmail({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email for user ${event.userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent(EventName.USER_REGISTERED, { async: true })
  async handleUserRegistered(event: Events.UserRegisteredEvent): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
        relations: { organization: true },
      });

      if (!user) {
        this.logger.warn(`User ${event.userId} not found for welcome email`);
        return;
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_BASE_URL');

      const email = buildWelcomeEmail({
        userName: user.firstName || user.email.split('@')[0],
        organizationName: user.organization?.name || 'the platform',
        loginUrl: frontendUrl || undefined,
      });

      await this.mailService.sendEmail({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(
        `Welcome email sent to newly registered user ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email for user ${event.userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent(EventName.USER_PASSWORD_RESET_REQUESTED, { async: true })
  async handlePasswordResetRequested(
    event: Events.UserPasswordResetRequestedEvent,
  ): Promise<void> {
    this.logger.log(
      `Password reset event received for user ${event.userId}, resetLink: ${event.resetLink}`,
    );
    try {
      // Try to find as web user first
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
        relations: { organization: true },
      });

      if (!user) {
        this.logger.warn(
          `User ${event.userId} not found for password reset email`,
        );
        return;
      }

      const userEmail = user.email;
      const userName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.email.split('@')[0];
      const organizationName = user.organization?.name || 'the platform';

      const email = buildPasswordResetEmail({
        userName,
        organizationName,
        resetLink: event.resetLink,
        expiryHours: 1,
      });

      this.logger.log(
        `Attempting to send password reset email to ${userEmail} with link: ${event.resetLink}`,
      );

      const result = await this.mailService.sendEmail({
        to: userEmail,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(
        `Password reset email sent successfully to ${userEmail}. Message ID: ${result.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email for user ${event.userId}`,
        error instanceof Error ? error.stack : error,
      );
      this.logger.error(
        `Error details: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @OnEvent(EventName.SIGNUP_OTP_REQUESTED, { async: true })
  async handleSignupOtpRequested(
    event: Events.SignupOtpRequestedEvent,
  ): Promise<void> {
    try {
      const email = buildSignupOtpEmail({
        otp: event.otp,
        expiresInMinutes: event.expiresInMinutes,
      });

      await this.mailService.sendEmail({
        to: event.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(`Signup OTP email sent to ${event.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send signup OTP email to ${event.email}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent(EventName.SIGNUP_WAITLIST_JOINED, { async: true })
  async handleSignupWaitlistJoined(
    event: Events.SignupWaitlistJoinedEvent,
  ): Promise<void> {
    const recipient =
      this.configService.get<string>('SIGNUP_WAITLIST_NOTIFY_EMAIL') ||
      'hello@rabbithr.co';
    try {
      const email = buildSignupWaitlistEmail({
        email: event.email,
        firstName: event.firstName,
        lastName: event.lastName,
        phone: event.phone,
        phoneCountryCode: event.phoneCountryCode,
        organizationName: event.organizationName,
        userAgent: event.userAgent,
        ipAddress: event.ipAddress,
        submittedAt: event.timestamp,
      });

      await this.mailService.sendEmail({
        to: recipient,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(
        `Signup waitlist email sent to ${recipient} for ${event.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send signup waitlist email for ${event.email}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent(EventName.USER_CREDENTIALS_SENT, { async: true })
  async handleUserCredentialsSent(
    event: Events.UserCredentialsSentEvent,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
        relations: { organization: true },
      });

      if (!user) {
        this.logger.warn(
          `User ${event.userId} not found for credentials email`,
        );
        return;
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_BASE_URL');

      const email = buildUserCredentialsEmail({
        userName: user.firstName || user.email.split('@')[0],
        organizationName: user.organization?.name || 'the platform',
        email: user.email,
        password: event.password,
        loginUrl: frontendUrl || undefined,
      });

      await this.mailService.sendEmail({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(`Credentials email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send credentials email for user ${event.userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  @OnEvent(EventName.USER_PASSWORD_ADMIN_RESET, { async: true })
  async handleUserPasswordAdminReset(
    event: Events.UserPasswordAdminResetEvent,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: event.userId },
        relations: { organization: true },
      });

      if (!user) {
        this.logger.warn(
          `User ${event.userId} not found for admin password reset email`,
        );
        return;
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_BASE_URL');

      const email = buildAdminPasswordResetEmail({
        userName: user.firstName || user.email.split('@')[0],
        organizationName: user.organization?.name || 'the platform',
        email: user.email,
        password: event.password,
        loginUrl: frontendUrl || undefined,
      });

      await this.mailService.sendEmail({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      this.logger.log(`Admin password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send admin password reset email for user ${event.userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
