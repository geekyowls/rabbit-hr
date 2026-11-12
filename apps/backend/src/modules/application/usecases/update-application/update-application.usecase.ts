import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationRepository, UserRepository } from '@db/repositories';
import { pickDefined } from '@shared/helpers/pick-defined';
import { GetApplication } from '../get-application/get-application.usecase';
import { UpdateApplicationCommand } from './update-application.command';

@Injectable()
export class UpdateApplication {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly userRepository: UserRepository,
    private readonly getApplication: GetApplication,
  ) {}

  async execute(command: UpdateApplicationCommand) {
    const application = await this.applicationRepository.findOne({
      where: {
        id: command.applicationId,
        organizationId: command.organizationId,
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    await this.userRepository.assertInOrganization(
      command.ownerId,
      command.organizationId,
    );

    const changes = pickDefined({
      rating: command.rating,
      shortlisted: command.shortlisted,
      ownerId: command.ownerId,
    });
    if (Object.keys(changes).length > 0) {
      await this.applicationRepository.update({ id: application.id }, changes);
    }

    return this.getApplication.execute(application.id, command.organizationId);
  }
}
