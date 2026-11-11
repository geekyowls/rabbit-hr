import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidateRepository } from '@db/repositories';
import { DeleteCandidateCommand } from './delete-candidate.command';

@Injectable()
export class DeleteCandidate {
  constructor(private readonly candidateRepository: CandidateRepository) {}

  async execute(
    command: DeleteCandidateCommand,
  ): Promise<{ success: boolean }> {
    const result = await this.candidateRepository.delete({
      id: command.candidateId,
      organizationId: command.organizationId,
    });
    if (!result.affected) {
      throw new NotFoundException('Candidate not found');
    }
    return { success: true };
  }
}
