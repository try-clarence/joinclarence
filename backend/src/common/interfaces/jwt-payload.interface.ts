/**
 * JWT Payload Interface
 * Represents the payload returned by JwtStrategy.validate()
 * Used for typing the @CurrentUser() decorator
 */
export interface JwtPayload {
  userId: string;
  phone: string;
}

/**
 * JWT Refresh Payload Interface
 * Extended payload for refresh token validation
 */
export interface JwtRefreshPayload extends JwtPayload {
  jti: string; // JWT ID for refresh token
}
