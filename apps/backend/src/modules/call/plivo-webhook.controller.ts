import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ExcludeFromIdempotency } from '@shared/framework/exclude-from-idempotency';
import type { PlivoHangupBody } from './dtos/call.dto';
import { HandlePlivoAnswer } from './usecases/handle-plivo-answer/handle-plivo-answer.usecase';
import { HandlePlivoHangup } from './usecases/handle-plivo-hangup/handle-plivo-hangup.usecase';

@ApiExcludeController()
@SkipThrottle()
@Controller('public/plivo/calls')
export class PlivoWebhookController {
  constructor(
    private readonly handlePlivoAnswer: HandlePlivoAnswer,
    private readonly handlePlivoHangup: HandlePlivoHangup,
  ) {}

  @Post(':callId/answer')
  @ExcludeFromIdempotency()
  async answer(
    @Param('callId', ParseUUIDPipe) callId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const xml = await this.handlePlivoAnswer.execute(callId, req);
    res.status(HttpStatus.OK).type('application/xml').send(xml);
  }

  @Post(':callId/hangup')
  @HttpCode(HttpStatus.OK)
  @ExcludeFromIdempotency()
  async hangup(
    @Param('callId', ParseUUIDPipe) callId: string,
    @Body() body: PlivoHangupBody,
    @Req() req: Request,
  ) {
    return this.handlePlivoHangup.execute(callId, body ?? {}, req);
  }
}
