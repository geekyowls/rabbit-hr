import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@db/repositories';
import { UserStatus } from '@db/enums';
import { buildUrl } from '@boilerplate/core';
import { EventName, UserInviteResentEvent } from '@boilerplate/core';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { ResendInviteCommand } from './resend-invite.command';

export interface ResendInviteResult {
  inviteLink: string;
  emailSent: boolean;
}

@Injectable()
export class ResendInvite {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: ResendInviteCommand): Promise<ResendInviteResult> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.inviteToken')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('user.id = :id', { id: command.userId })
      .andWhere('user.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate user is still invited and not onboarded
    if (user.status !== UserStatus.INVITED || user.onboarded) {
      throw new BadRequestException('User has already completed onboarding');
    }

    // Extend invite expiry (24 hours from now)
    user.inviteExpires = new Date();
    user.inviteExpires.setHours(user.inviteExpires.getHours() + 24);

    await this.userRepository.save(user);

    const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL');
    const inviteLink = buildUrl(
      frontendBaseUrl,
      `/accept-invite?token=${user.inviteToken}`,
    );

    this.eventEmitter.emit<UserInviteResentEvent>({
      eventName: EventName.USER_INVITE_RESENT,
      timestamp: new Date(),
      userId: user.id,
      organizationId: command.organizationId,
      inviteLink,
      triggeredBy: command.currentUserId,
    });

    return {
      inviteLink,
      emailSent: true,
    };
  }
}
