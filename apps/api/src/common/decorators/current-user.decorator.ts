import { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import { User } from '@prisma/client';
import { RequestWithContext } from '../types/request-with-context';

/** Injects the authenticated User (set by AuthGuard). Undefined for guests. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.user;
  },
);
