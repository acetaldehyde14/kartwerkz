import { formatMoney, money } from '@kartwerkz/shared';
import type { Money } from '@kartwerkz/shared';

/**
 * Dev-only placeholder base price, mirroring DEV_BASE_PRICE_MINOR_UNITS
 * from .env.example. Real commercial pricing must come from the API's
 * product/pricing data before go-live — see docs/architecture.md.
 */
export const DEV_BASE_PRICE_MINOR_UNITS = 89_900;
export const DEV_CURRENCY = 'SGD';

export function getDevPlaceholderPrice(): Money {
  return money(DEV_BASE_PRICE_MINOR_UNITS, DEV_CURRENCY);
}

/** Formats a Money value as a "from $X" teaser string, e.g. "from SGD 899.00". */
export function formatFromPrice(amount: Money): string {
  return `from ${formatMoney(amount)}`;
}
