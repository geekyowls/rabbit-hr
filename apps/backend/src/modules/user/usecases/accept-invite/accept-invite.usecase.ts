import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '@db/repositories';
import { UserStatus } from '@db/enums';
import { EventName, UserInviteAcceptedEvent } from '@boilerplate/core';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { AcceptInviteCommand } from './accept-invite.command';
import { AuthService } from '@modules/auth/services/auth.service';

@Injectable()
export class AcceptInvite {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: AcceptInviteCommand) {
    // Find user by invite token
    const user = await this.userRepository.findByInviteToken(
      command.inviteToken,
    );

    if (!user) {
      throw new NotFoundException('Invalid invitation token');
    }

    // Check if invitation has expired
    if (user.inviteExpires && user.inviteExpires < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if already onboarded
    if (user.onboarded) {
      throw new BadRequestException('User has already completed onboarding');
    }

    // Hash password
    const hashedPassword = await this.authService.hashPassword(
      command.password,
    );

    // Update user - complete onboarding
    user.password = hashedPassword;
    user.firstName = command.firstName || user.firstName;
    user.lastName = command.lastName || user.lastName;
    user.status = UserStatus.ACTIVE;
    user.isActive = true;
    user.onboarded = true;
    user.inviteToken = null;
    user.inviteExpires = null;

    await this.userRepository.save(user);

    this.eventEmitter.emit<UserInviteAcceptedEvent>({
      eventName: EventName.USER_INVITE_ACCEPTED,
      timestamp: new Date(),
      userId: user.id,
      organizationId: user.organizationId,
      triggeredBy: user.id,
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        organization: user.organization,
      },
    };
  }
}
