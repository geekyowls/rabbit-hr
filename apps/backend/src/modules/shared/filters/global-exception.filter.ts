import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { CommandValidationException } from '@boilerplate/core';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errors: Record<string, unknown> | undefined;

    if (exception instanceof CommandValidationException) {
      // Handle command validation errors from BaseCommand
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      errors = exception.constraintsViolated;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errors = responseObj.errors;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
      message = 'Internal server error';
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
