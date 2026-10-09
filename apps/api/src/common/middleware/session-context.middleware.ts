import { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../session.util';
import { RequestWithContext } from '../types/request-with-context';

/**
 * Non-blocking: attaches `req.user` when a valid, unexpired session cookie
 * is present. Does NOT reject the request when it is absent or invalid —
 * route-level AuthGuard is responsible for enforcement. This lets routes
 * that accept either an authenticated user or a guest (cart, configurations,
 * uploads) read `req.user` without forcing authentication everywhere.
 */
@Injectable()
export class SessionContextMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async use(req: RequestWithContext, _res: Response, next: NextFunction): Promise<void> {
    const cookieName = this.config.get<string>('SESSION_COOKIE_NAME', 'kw_session');
    const token: string | undefined = req.signedCookies?.[cookieName] ?? req.cookies?.[cookieName];

    if (token) {
      const tokenHash = hashToken(token);
      const session = await this.prisma.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      if (session && session.expiresAt > new Date()) {
        req.user = session.user;
      }
    }

    next();
  }
}
