import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

export const ApiCommonResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Bad Request' },
          timestamp: { type: 'string', example: '2025-01-05T00:00:00.000Z' },
          path: { type: 'string', example: '/api/v1/resource' },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
          timestamp: { type: 'string' },
          path: { type: 'string' },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Forbidden',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden' },
          timestamp: { type: 'string' },
          path: { type: 'string' },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Not Found',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Not Found' },
          timestamp: { type: 'string' },
          path: { type: 'string' },
        },
      },
    }),
    ApiUnprocessableEntityResponse({
      description: 'Validation Error',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 422 },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'object',
            example: {
              email: {
                messages: ['email must be an email'],
                value: 'invalid-email',
              },
            },
          },
          timestamp: { type: 'string' },
          path: { type: 'string' },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      schema: {
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Internal Server Error' },
          timestamp: { type: 'string' },
          path: { type: 'string' },
        },
      },
    }),
  );
};
