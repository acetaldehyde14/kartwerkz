import { Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Requires the raw request body (NestFactory.create(AppModule, { rawBody:
   * true }) in main.ts) because Stripe signature verification is computed
   * over the exact raw bytes — a re-serialized JSON body would not match.
   */
  @Post('stripe')
  async stripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.webhooksService.handleStripeWebhook(req.rawBody ?? Buffer.from(''), signature);
  }
}
