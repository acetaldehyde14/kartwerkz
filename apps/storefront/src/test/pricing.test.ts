import { describe, expect, it } from 'vitest';
import { formatFromPrice, getDevPlaceholderPrice } from '@/lib/pricing';

describe('pricing helpers', () => {
  it('returns the dev placeholder price as integer minor units in SGD', () => {
    const price = getDevPlaceholderPrice();
    expect(price.currency).toBe('SGD');
    expect(Number.isInteger(price.amountMinorUnits)).toBe(true);
  });

  it('formats a "from" price teaser', () => {
    const formatted = formatFromPrice({ amountMinorUnits: 89_900, currency: 'SGD' });
    expect(formatted.startsWith('from ')).toBe(true);
    expect(formatted).toContain('899.00');
  });
});
