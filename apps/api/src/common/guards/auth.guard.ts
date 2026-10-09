import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestWithContext } from '../types/request-with-context';

/**
 * Enforces authentication. Relies on SessionContextMiddleware (applied
 * globally) having already attempted to attach `req.user` from the session
 * cookie — this guard just rejects if that attempt did not succeed.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }
    return true;
  }
}
