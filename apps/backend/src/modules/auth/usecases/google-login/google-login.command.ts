import { BaseCommand } from '@boilerplate/core';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginCommand extends BaseCommand {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  accessToken!: string;
}
