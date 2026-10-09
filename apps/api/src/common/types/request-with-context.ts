import { Request } from 'express';
import { User } from '@prisma/client';

/**
 * Augmented Express request populated by AuthGuard (optional — sets `user`
 * when a valid session cookie is present) and GuestSessionMiddleware (always
 * ensures `guestSessionId` is set, creating a GuestSession row + cookie on
 * first contact for unauthenticated visitors).
 */
export interface RequestWithContext extends Request {
  user?: User;
  guestSessionId?: string;
}
