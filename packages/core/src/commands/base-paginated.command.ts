import { IsInt, Max, Min } from 'class-validator';
import { BaseAuthenticatedCommand } from './base-authenticated.command';

export abstract class BasePaginatedCommand extends BaseAuthenticatedCommand {
  @IsInt()
  @Min(1)
  page!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}
