export interface CreateCheckoutSessionParams {
  orderId: string;
  orderNumber: string;
  amountMinorUnits: number;
  currency: string;
  customerEmail: string;
}

export interface CreateCheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Strategy interface so checkout logic never depends on Stripe directly.
 * StripePaymentAdapter is the real implementation; DevPaymentAdapter is a
 * documented, NODE_ENV-guarded stub used only when STRIPE_SECRET_KEY is
 * unset (local development without Stripe test keys configured).
 */
export interface PaymentProvider {
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CreateCheckoutSessionResult>;

  /** Verifies and parses a raw webhook payload. Throws on invalid signature. */
  verifyWebhookSignature(payload: Buffer, signatureHeader: string): unknown;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';
