import { apiFetch } from './client';
import type { CheckoutSessionResponse, CreateCheckoutSessionInput } from './types';

/**
 * Creates a Stripe Checkout session server-side and returns the hosted
 * payment page URL. Payment card details are NEVER handled by this app —
 * the browser is redirected to Stripe's own hosted checkout page.
 */
export function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResponse> {
  return apiFetch<CheckoutSessionResponse>('/checkout/session', {
    method: 'POST',
    body: input,
  });
}

/**
 * Dev-only stand-in for the Stripe webhook — only reachable when
 * DevPaymentAdapter issued the checkout session (STRIPE_SECRET_KEY unset)
 * and hard-disabled server-side outside development. Called by
 * `/checkout/dev-confirm`, the page `checkoutUrl` points at in that case.
 */
export function confirmDevPayment(orderId: string): Promise<{ confirmed: true }> {
  return apiFetch<{ confirmed: true }>(`/checkout/dev-confirm/${orderId}`, {
    method: 'POST',
  });
}
