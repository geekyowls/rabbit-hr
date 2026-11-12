import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AvailabilityResponseDto } from '../../dtos/interview-booking.dto';
import { InterviewerAvailabilityService } from '../../services/interviewer-availability.service';
import { GetMyAvailabilityCommand } from './get-my-availability.command';

@Injectable()
export class GetMyAvailability {
  constructor(
    private readonly dataSource: DataSource,
    private readonly availabilityService: InterviewerAvailabilityService,
  ) {}

  async execute(
    command: GetMyAvailabilityCommand,
  ): Promise<AvailabilityResponseDto> {
    const [availability] = await this.availabilityService.resolve(
      this.dataSource.manager,
      command.organizationId,
      [command.userId],
    );
    return availability;
  }
}
