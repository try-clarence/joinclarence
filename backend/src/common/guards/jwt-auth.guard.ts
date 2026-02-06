import { IS_PUBLIC_KEY } from '@common/decorators';
import { UnauthorizedException } from '@common/exceptions';
import { ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import { Observable } from 'rxjs';

export const IS_OPTIONAL_AUTH_KEY = 'is_optional_auth';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly _reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const isOptional = this._reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    // mark request for handleRequest
    context.switchToHttp().getRequest().isOptionalAuth = isOptional;

    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  override handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): any {
    const req = context.switchToHttp().getRequest();

    if (info instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedException('Token expired');
    }

    // Optional auth: allow anonymous
    if (req.isOptionalAuth) {
      return user ?? null;
    }

    // Required auth
    if (err || !user) {
      throw new UnauthorizedException(err?.message ?? 'Unauthorized user');
    }

    return user;
  }
}
