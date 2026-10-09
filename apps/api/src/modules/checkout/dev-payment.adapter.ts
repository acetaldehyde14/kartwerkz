import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateCheckoutSessionParams,
  CreateCheckoutSessionResult,
  PaymentProvider,
} from './payment-provider.interface';

/**
 * STUB payment provider used only when STRIPE_SECRET_KEY is blank (local
 * dev without Stripe test keys). It never talks to a real payment network —
 * it returns a fake redirect to a local `/checkout/dev-confirm` page that
 * the storefront can call to simulate a successful payment via
 * CheckoutController#devConfirm. This adapter MUST NEVER be selected in
 * production — CheckoutModule's PAYMENT_PROVIDER factory hard-fails at
 * startup if NODE_ENV=production and STRIPE_SECRET_KEY is unset, so this
 * class is only ever actually *used* in development/test. (It is still
 * instantiated as a Nest provider regardless of which one the factory
 * picks, so the guard lives in the factory, not here, to avoid breaking
 * production boot merely by this class existing in the DI graph.)
 */
@Injectable()
export class DevPaymentAdapter implements PaymentProvider {
  private readonly logger = new Logger(DevPaymentAdapter.name);

  constructor(private readonly config: ConfigService) {
    if (this.config.get<string>('NODE_ENV') !== 'production') {
      this.logger.warn(
        '!!! DevPaymentAdapter is available — if selected, payments are NOT real. Set STRIPE_SECRET_KEY to use Stripe. !!!',
      );
    }
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<CreateCheckoutSessionResult> {
    const fakeSessionId = `dev_${params.orderId}`;
    return {
      sessionId: fakeSessionId,
      url: `http://localhost:3000/checkout/dev-confirm?order=${params.orderNumber}&orderId=${params.orderId}`,
    };
  }

  verifyWebhookSignature(_payload: Buffer, _signatureHeader: string): unknown {
    throw new NotImplementedException(
      'DevPaymentAdapter has no webhook — use POST /checkout/dev-confirm/:orderId in development instead.',
    );
  }
}
