/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { CoreErrorResponse } from '@common/interfaces';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const INTERNAL_SERVER_ERROR_MESSAGE =
  HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR];

// Sensitive headers that should be filtered from logs
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'set-cookie',
]);

// Sensitive body fields that should be filtered
const SENSITIVE_BODY_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'authorization',
]);

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly _logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine if this is an HttpException or another type of error
    const status = this._getHttpStatus(exception);
    const errorResponse = this._getErrorResponse(exception);
    const message = this._getErrorMessage(exception);

    // Create detailed error context for logging with sensitive data filtered
    const errorContext = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      clientIp: this._getClientIp(request),
      headers: this._filterSensitiveHeaders(request.headers),
      query: request.query,
      userAgent: request.headers['user-agent'],
      errorResponse: status >= 500 ? '[FILTERED]' : errorResponse,
      stack:
        exception instanceof Error
          ? exception?.stack
          : exception instanceof HttpException
            ? exception?.stack
            : undefined,
    };

    // Log with appropriate severity level
    this._logError(request, status, message, errorContext);

    const errors =
      typeof errorResponse === 'object' && 'errors' in errorResponse
        ? errorResponse.errors
        : (HttpStatus[status] ?? INTERNAL_SERVER_ERROR_MESSAGE);

    // Construct client-friendly response
    const responseBody: CoreErrorResponse = {
      statusCode: status,
      success: false,
      data: null,
      message: this._sanitizeErrorMessage(message, status),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      body: request.body as Record<string, unknown>,
      errors,
    };

    response.status(status).json(responseBody);
  }

  private _getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private _getErrorResponse(exception: unknown): CoreErrorResponse | string {
    if (exception instanceof HttpException) {
      return exception.getResponse() as CoreErrorResponse;
    }

    return INTERNAL_SERVER_ERROR_MESSAGE;
  }

  private _getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return INTERNAL_SERVER_ERROR_MESSAGE;
  }

  private _getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      (request.headers['x-real-ip'] as string) ??
      request.socket.remoteAddress ??
      request.ip ??
      'unknown'
    );
  }

  private _filterSensitiveHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const filtered: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
        filtered[key] = '[FILTERED]';
      } else {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  private _filterSensitiveData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const filtered: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (
        SENSITIVE_BODY_FIELDS.has(key.toLowerCase()) ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret')
      ) {
        filtered[key] = '[FILTERED]';
      } else if (typeof value === 'object' && value !== null) {
        filtered[key] = Array.isArray(value)
          ? value.map((item) =>
              typeof item === 'object'
                ? this._filterSensitiveData(item as Record<string, unknown>)
                : item,
            )
          : this._filterSensitiveData(value as Record<string, unknown>);
      } else {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  private _logError(
    request: Request,
    status: number,
    message: string,
    context: Record<string, unknown>,
  ): void {
    const logMessage = `[${request.method}] ${request.url} - ${String(status)} ${message}`;

    if (status >= 500) {
      this._logger.error(logMessage, context);
    } else if (status >= 400) {
      this._logger.warn(logMessage, context);
    } else {
      this._logger.log(logMessage, context);
    }
  }

  private _sanitizeErrorMessage(message: string, status: number): string {
    // Don't expose internal error details in production for 5xx errors
    if (status >= 500 && process.env.NODE_ENV === 'production') {
      return 'Internal server error occurred';
    }

    return message;
  }
}
