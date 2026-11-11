import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { In } from 'typeorm';
import { ClientRepository, UserRepository } from '@db/repositories';
import { ScreeningQuestion } from '@db/entities';
import { ScreeningQuestionDto } from '../dtos/create-job.dto';

export interface JobReferenceIds {
  clientId?: string | null;
  ownerId?: string | null;
  hiringManagerId?: string | null;
  recruiterId?: string | null;
  hiringTeamIds?: string[];
}

export async function assertJobReferences(
  clientRepository: ClientRepository,
  userRepository: UserRepository,
  organizationId: string,
  references: JobReferenceIds,
): Promise<void> {
  const { clientId } = references;
  if (clientId) {
    const exists = await clientRepository.exists({
      where: { id: clientId, organizationId },
    });
    if (!exists) {
      throw new BadRequestException('Client not found');
    }
  }
  const userIds = [
    ...new Set(
      [
        references.ownerId,
        references.hiringManagerId,
        references.recruiterId,
        ...(references.hiringTeamIds ?? []),
      ].filter((id): id is string => !!id),
    ),
  ];
  if (userIds.length > 0) {
    const found = await userRepository.count({
      where: { id: In(userIds), organizationId },
    });
    if (found !== userIds.length) {
      throw new BadRequestException('User not found in this organization');
    }
  }
}

export function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
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
