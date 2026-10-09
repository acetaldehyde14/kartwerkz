import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ id: string; email: string }> {
    const user = await this.authService.register(dto.email, dto.password);
    return { id: user.id, email: user.email };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ id: string; email: string }> {
    const { user, token, expiresAt } = await this.authService.login(
      dto.email,
      dto.password,
      req.get('user-agent') ?? undefined,
      req.ip,
    );
    res.cookie(this.authService.getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.authService.isProd(),
      signed: true,
      expires: expiresAt,
      path: '/',
    });
    return { id: user.id, email: user.email };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const cookieName = this.authService.getSessionCookieName();
    const token: string | undefined = req.signedCookies?.[cookieName] ?? req.cookies?.[cookieName];
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(cookieName, { path: '/' });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: User): { id: string; email: string; role: string } {
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('password-reset/request')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(202)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto): Promise<{ accepted: true }> {
    await this.authService.requestPasswordReset(dto.email);
    return { accepted: true };
  }

  @Post('password-reset/confirm')
  @HttpCode(204)
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto): Promise<void> {
    await this.authService.confirmPasswordReset(dto.token, dto.newPassword);
  }
}
