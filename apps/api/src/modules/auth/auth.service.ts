import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { generateSessionToken, hashToken } from '../../common/session.util';
import { SEND_EMAIL_QUEUE } from '../queues/queue.module';
import { SendEmailJobPayload } from '../queues/jobs.types';

const SESSION_TTL_DAYS = 30;
const PASSWORD_RESET_TTL_MINUTES = 30;

export interface SessionIssueResult {
  user: User;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(SEND_EMAIL_QUEUE) private readonly emailQueue: Queue<SendEmailJobPayload>,
  ) {}

  async register(email: string, password: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await argon2.hash(password);
    return this.prisma.user.create({ data: { email, passwordHash } });
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<SessionIssueResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueSession(user, userAgent, ipAddress);
  }

  async issueSession(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<SessionIssueResult> {
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: { userId: user.id, tokenHash, userAgent, ipAddress, expiresAt },
    });
    return { user, token, expiresAt };
  }

  async logout(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await this.prisma.session.deleteMany({ where: { tokenHash } });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always respond as if successful — never reveal account existence.
    if (!user) return;

    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    await this.emailQueue.add(SEND_EMAIL_QUEUE, {
      type: 'password-reset',
      to: user.email,
      data: { token },
    });
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing sessions on password change.
      this.prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
    ]);
  }

  getSessionCookieName(): string {
    return this.config.get<string>('SESSION_COOKIE_NAME', 'kw_session');
  }

  isProd(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }
}
