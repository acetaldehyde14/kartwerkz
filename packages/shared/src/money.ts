/**
 * Money is always represented as integer minor units (e.g. SGD cents) plus
 * an ISO 4217 currency code. Never use floating point for financial math —
 * see docs/architecture.md#pricing-engine.
 */
export interface Money {
  amountMinorUnits: number;
  currency: string;
}

export function money(amountMinorUnits: number, currency = 'SGD'): Money {
  if (!Number.isInteger(amountMinorUnits)) {
    throw new TypeError(`amountMinorUnits must be an integer, got ${amountMinorUnits}`);
  }
  return { amountMinorUnits, currency };
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinorUnits + b.amountMinorUnits, a.currency);
}

export function multiplyMoney(a: Money, factor: number): Money {
  if (!Number.isInteger(factor)) {
    throw new TypeError(`multiplyMoney factor must be an integer quantity, got ${factor}`);
  }
  return money(a.amountMinorUnits * factor, a.currency);
}

export function sumMoney(items: Money[], currency = 'SGD'): Money {
  return items.reduce((acc, item) => addMoney(acc, item), money(0, currency));
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

const MINOR_UNITS_PER_MAJOR: Record<string, number> = {
  SGD: 100,
  USD: 100,
  EUR: 100,
  GBP: 100,
  JPY: 1,
};

/** Formats money for display, e.g. { amountMinorUnits: 89900, currency: 'SGD' } -> "SGD 899.00" */
export function formatMoney(m: Money, locale = 'en-SG'): string {
  const divisor = MINOR_UNITS_PER_MAJOR[m.currency] ?? 100;
  const major = m.amountMinorUnits / divisor;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    currencyDisplay: 'code',
  }).format(major);
}
