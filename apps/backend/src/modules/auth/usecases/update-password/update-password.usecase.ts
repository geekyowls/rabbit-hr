import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository, UserSessionRepository } from '@db/repositories';
import { AuthService } from '../../services/auth.service';
import { UpdatePasswordCommand } from './update-password.command';

@Injectable()
export class UpdatePassword {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(command: UpdatePasswordCommand): Promise<void> {
    // Validate passwords match
    if (command.newPassword !== command.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: command.userId })
      .andWhere('user.organizationId = :organizationId', {
        organizationId: command.organizationId,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.authService.comparePasswords(
      command.currentPassword,
      user.password ?? '',
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and update new password
    const newPasswordHash = await this.authService.hashPassword(
      command.newPassword,
    );
    user.password = newPasswordHash;
    await this.userRepository.save(user);

    // Revoke every active session for this user (logout all devices)
    await this.userSessionRepository.revokeAllForUser(user.id);
  }
}
