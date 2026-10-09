import { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestWithContext } from '../types/request-with-context';

const GUEST_SESSION_TTL_DAYS = 90;

/**
 * Ensures every request carries a GuestSession, creating one (and setting
 * its cookie) on first contact. This backs anonymous cart/configurator
 * flows. The guest session id itself is the cookie value (a UUIDv4, 122
 * bits of entropy) rather than a hashed token — unlike the authenticated
 * Session, a guest session carries no elevated privilege, only ownership
 * of pre-checkout drafts, so this tradeoff is acceptable for the MVP.
 */
@Injectable()
export class GuestSessionMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async use(req: RequestWithContext, res: Response, next: NextFunction): Promise<void> {
    const cookieName = this.config.get<string>('GUEST_SESSION_COOKIE_NAME', 'kw_guest');
    const existingId: string | undefined =
      req.signedCookies?.[cookieName] ?? req.cookies?.[cookieName];

    if (existingId) {
      const existing = await this.prisma.guestSession.findUnique({ where: { id: existingId } });
      if (existing && existing.expiresAt > new Date()) {
        req.guestSessionId = existing.id;
        next();
        return;
      }
    }

    const expiresAt = new Date(Date.now() + GUEST_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    const created = await this.prisma.guestSession.create({ data: { expiresAt } });
    req.guestSessionId = created.id;

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(cookieName, created.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      signed: true,
      expires: expiresAt,
      path: '/',
    });

    next();
  }
}
