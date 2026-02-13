import { CoreErrorResponse } from '@common/interfaces';
import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

/**
 * Base exception class that extends NestJS HttpException
 * All other custom exceptions should extend this class
 */
export class Exception extends HttpException {
  constructor(
    statusCode: HttpStatus,
    message: string,
    data?: unknown,
    cause?: Error,
  ) {
    // Validate status code
    if (!Exception._isValidHttpStatus(statusCode)) {
      throw new Error(`Invalid HTTP status code: ${String(statusCode)}`);
    }

    // Validate message
    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      throw new Error('Exception message must be a non-empty string');
    }

    // Create exception options with cause if provided
    const options: HttpExceptionOptions = {};

    if (cause) {
      options.cause = cause;
    }

    // Only add description if data is a string
    if (typeof data === 'string') {
      options.description = data;
    }

    // Create structured response
    const response: CoreErrorResponse = {
      success: false,
      statusCode,
      message: message.trim(),
      errors: data ?? HttpStatus[statusCode],
      timestamp: new Date().toISOString(),
      data: null,
    };

    super(response, statusCode, options);
  }

  private static _isValidHttpStatus(statusCode: number): boolean {
    return (
      Number.isInteger(statusCode) && statusCode >= 100 && statusCode < 600
    );
  }
}

// 4xx Client Error Exceptions
export class BadRequestException extends Exception {
  constructor(
    message = HttpStatus[HttpStatus.BAD_REQUEST],
    data?: unknown,
    cause?: Error,
  ) {
    super(HttpStatus.BAD_REQUEST, message, data, cause);
    Object.setPrototypeOf(this, BadRequestException.prototype);
  }
}

export class UnauthorizedException extends Exception {
  constructor(
    message = HttpStatus[HttpStatus.UNAUTHORIZED],
    data?: unknown,
    cause?: Error,
  ) {
    super(HttpStatus.UNAUTHORIZED, message, data, cause);
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

export class ForbiddenException extends Exception {
  constructor(
    message = HttpStatus[HttpStatus.FORBIDDEN],
    data?: unknown,
    cause?: Error,
  ) {
    super(HttpStatus.FORBIDDEN, message, data, cause);
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}

export class NotFoundException extends Exception {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(
    message = HttpStatus[HttpStatus.NOT_FOUND],
    data?: unknown,
    cause?: Error,
  ) {
    super(HttpStatus.NOT_FOUND, message, data, cause);

    // Extract resource info from context if available

    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

export class ConflictException extends Exception {
  constructor(
    message = HttpStatus[HttpStatus.CONFLICT],
    data?: unknown,
    cause?: Error,
  ) {
    super(HttpStatus.CONFLICT, message, data, cause);
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}

export class UnprocessableEntityException extends Exception {
  constructor(
    message = HttpStatus[HttpStatus.UNPROCESSABLE_ENTITY],
    data?: unknown,
    cause?: Error,
  ) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, message, data, cause);
    Object.setPrototypeOf(this, UnprocessableEntityException.prototype);
  }
}

// 5xx Server Error Exceptions
export class InternalServerErrorException extends Exception {
  constructor(
    message = HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
    cause?: Error,
  ) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, undefined, cause);
    Object.setPrototypeOf(this, InternalServerErrorException.prototype);
  }
}

export class BadGatewayException extends Exception {
  constructor(
    message = HttpStatus[HttpStatus.BAD_GATEWAY],
    data?: unknown,
    cause?: Error,
  ) {
    super(HttpStatus.BAD_GATEWAY, message, data, cause);
    Object.setPrototypeOf(this, BadGatewayException.prototype);
  }
}

export class GatewayTimeoutException extends Exception {
  constructor(
    message = HttpStatus[HttpStatus.GATEWAY_TIMEOUT],
    data?: unknown,
    cause?: Error,
  ) {
    super(HttpStatus.GATEWAY_TIMEOUT, message, data, cause);
    Object.setPrototypeOf(this, GatewayTimeoutException.prototype);
  }
}

export class ExceptionHandler {
  static handleErrorException(error: unknown, message?: string): never {
    if (error instanceof Exception) {
      throw error;
    }

    const errorMessage =
      message ??
      (error instanceof Error ? error.message : 'Internal server error');

    throw new InternalServerErrorException(errorMessage);
  }
}
