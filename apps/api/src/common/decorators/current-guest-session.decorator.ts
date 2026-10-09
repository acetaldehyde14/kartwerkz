import { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import { RequestWithContext } from '../types/request-with-context';

/** Injects the current GuestSession id (set by GuestSessionMiddleware). */
export const CurrentGuestSessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.guestSessionId;
  },
);
