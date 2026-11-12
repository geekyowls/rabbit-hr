import {
  Equals,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BaseCommand } from '@boilerplate/core';

export class PublicOfferSignCommand extends BaseCommand {
  @IsString()
  @MaxLength(128)
  readonly token: string;
}

export class AcceptOfferSigningCommand extends PublicOfferSignCommand {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  readonly fullName: string;

  @IsBoolean()
  @Equals(true, { message: 'You must agree to sign electronically' })
  readonly consent: boolean;

  @IsString()
  @MaxLength(64)
  @IsOptional()
  readonly ip?: string;

  @IsString()
  @IsOptional()
  readonly userAgent?: string;
}

export class DeclineOfferSigningCommand extends PublicOfferSignCommand {
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  readonly reason?: string;
}
