import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CreateCheckoutSessionParams,
  CreateCheckoutSessionResult,
  PaymentProvider,
} from './payment-provider.interface';

/** Real payment provider backed by Stripe Checkout Sessions. */
@Injectable()
export class StripePaymentAdapter implements PaymentProvider {
  // Lazy: CheckoutModule's factory instantiates both adapters to pick one
  // via DI, so this class must construct cleanly even when STRIPE_SECRET_KEY
  // is unset and DevPaymentAdapter is the one actually selected. The real
  // Stripe SDK call (`new Stripe(apiKey)`) only happens on first real use.
  private _stripe: Stripe | undefined;
  private readonly webhookSecret: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;

  constructor(private readonly config: ConfigService) {
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    this.successUrl = this.config.get<string>(
      'STRIPE_SUCCESS_URL',
      'http://localhost:3000/checkout/success',
    );
    this.cancelUrl = this.config.get<string>(
      'STRIPE_CANCEL_URL',
      'http://localhost:3000/checkout/cancel',
    );
  }

  private get stripe(): Stripe {
    if (!this._stripe) {
      const apiKey = this.config.get<string>('STRIPE_SECRET_KEY', '');
      if (!apiKey) {
        throw new Error('StripePaymentAdapter used without STRIPE_SECRET_KEY configured.');
      }
      this._stripe = new Stripe(apiKey);
    }
    return this._stripe;
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<CreateCheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.customerEmail,
      client_reference_id: params.orderId,
      success_url: `${this.successUrl}?order=${params.orderNumber}`,
      cancel_url: `${this.cancelUrl}?order=${params.orderNumber}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: params.amountMinorUnits,
            product_data: { name: `Kartwerkz order ${params.orderNumber}` },
          },
        },
      ],
      metadata: { orderId: params.orderId, orderNumber: params.orderNumber },
    });
    return { sessionId: session.id, url: session.url ?? '' };
  }

  verifyWebhookSignature(payload: Buffer, signatureHeader: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signatureHeader, this.webhookSecret);
  }
}
