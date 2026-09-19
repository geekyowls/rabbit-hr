import { Injectable } from '@nestjs/common';
import { UserRepository } from '@db/repositories';
import { UpdatePagePreferencesCommand } from './update-page-preferences.command';

@Injectable()
export class UpdatePagePreferences {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdatePagePreferencesCommand) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.metadata')
      .where('user.id = :id', { id: command.userId })
      .getOne();

    const currentMetadata = user?.metadata || {};
    const pagePreferences = (currentMetadata.pagePreferences || {}) as Record<
      string,
      unknown
    >;

    const pageData: Record<string, unknown> = {};
    if (command.savedViews !== undefined) {
      pageData.savedViews = command.savedViews;
    }
    if (command.columns !== undefined) {
      pageData.columns = command.columns;
    }

    pagePreferences[command.page] = {
      ...((pagePreferences[command.page] as Record<string, unknown>) || {}),
      ...pageData,
    };

    await this.userRepository.update(command.userId, {
      metadata: {
        ...currentMetadata,
        pagePreferences,
      },
    });

    return pagePreferences;
  }
}
