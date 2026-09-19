import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@db/repositories';
import { UpdateProfileCommand } from './update-profile.command';
import { UserResponseDto } from '../../dtos/user-response.dto';

@Injectable()
export class UpdateProfile {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    command: UpdateProfileCommand,
  ): Promise<Partial<UserResponseDto>> {
    const user = await this.userRepository.findOne({
      where: {
        id: command.userId,
        organizationId: command.organizationId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.firstName = command.firstName;
    user.lastName = command.lastName || null;

    const updatedUser = await this.userRepository.save(user);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName ?? '',
      lastName: updatedUser.lastName ?? '',
      organizationId: updatedUser.organizationId,
    };
  }
}
