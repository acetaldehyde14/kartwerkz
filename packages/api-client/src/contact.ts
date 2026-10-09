import { apiFetch } from './client';
import type { ContactMessageInput } from './types';

/**
 * ASSUMPTION: `/contact` is not in the documented API route list yet.
 * This function is written against a plausible REST shape so the
 * storefront contact form has something real to call; confirm/adjust the
 * path once the API team adds the endpoint.
 */
export function sendContactMessage(input: ContactMessageInput): Promise<void> {
  return apiFetch<void>('/contact', {
    method: 'POST',
    body: input,
  });
}
