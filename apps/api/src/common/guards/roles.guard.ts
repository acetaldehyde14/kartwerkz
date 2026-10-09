import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithContext } from '../types/request-with-context';

/** Must run after AuthGuard: @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN'). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
