import { HttpStatus } from '@nestjs/common';

/**
 * Interface for standard API response
 */
export type CoreResponse = {
  success: boolean;
  statusCode: HttpStatus;
  data: unknown;
  message: string;
};

/**
 * Type for error response
 */
export type CoreErrorResponse = CoreResponse & {
  success: false;
  errors: unknown;
  timestamp: string;
  method?: string;
  path?: string;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
  stack?: string | undefined;
};
