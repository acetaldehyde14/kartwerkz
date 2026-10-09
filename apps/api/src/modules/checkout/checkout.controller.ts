import { Body, Controller, ForbiddenException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { CheckoutService } from './checkout.service';
import { type CheckoutResult } from './checkout.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentGuestSessionId } from '../../common/decorators/current-guest-session.decorator';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly config: ConfigService,
  ) {}

  @Post('session')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async createSession(
    @Body() dto: CreateCheckoutSessionDto,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ): Promise<CheckoutResult> {
    return this.checkoutService.createCheckoutSession(
      { userId: user?.id, guestSessionId },
      dto.contactEmail,
      dto.shippingAddressId,
    );
  }

  /**
   * Dev-only stand-in for the Stripe webhook, used by the storefront's
   * `/checkout/dev-confirm` page when DevPaymentAdapter issued the session
   * (i.e. STRIPE_SECRET_KEY is unset). Hard-disabled outside development —
   * production payment confirmation must ONLY ever come from the verified
   * Stripe webhook (see WebhooksController).
   */
  @Post('dev-confirm/:orderId')
  async devConfirm(@Param('orderId') orderId: string): Promise<{ confirmed: true }> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Dev payment confirmation is disabled in production');
    }
    await this.checkoutService.devConfirmPayment(orderId);
    return { confirmed: true };
  }
}
