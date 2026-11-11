import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ClientRepository, UserRepository } from '@db/repositories';
import { ScreeningQuestion } from '@db/entities';
import { ScreeningQuestionDto } from '../dtos/create-job.dto';

export async function assertJobReferences(
  clientRepository: ClientRepository,
  userRepository: UserRepository,
  organizationId: string,
  clientId: string | null | undefined,
  ownerId: string | null | undefined,
): Promise<void> {
  if (clientId) {
    const exists = await clientRepository.exists({
      where: { id: clientId, organizationId },
    });
    if (!exists) {
      throw new BadRequestException('Client not found');
    }
  }
  await userRepository.assertInOrganization(ownerId, organizationId);
}

export function normalizeScreeningQuestions(
  questions: ScreeningQuestionDto[],
): ScreeningQuestion[] {
  return questions.map((q) => ({
    id: q.id || randomUUID(),
    question: q.question,
    required: q.required,
  }));
}
