import { describe, expect, it } from 'vitest';
import { addMoney, formatMoney, money, multiplyMoney, sumMoney } from './money';

describe('money', () => {
  it('rejects non-integer minor units', () => {
    expect(() => money(10.5)).toThrow(TypeError);
  });

  it('adds two amounts in the same currency', () => {
    expect(addMoney(money(100, 'SGD'), money(50, 'SGD'))).toEqual({
      amountMinorUnits: 150,
      currency: 'SGD',
    });
  });

  it('throws on currency mismatch', () => {
    expect(() => addMoney(money(100, 'SGD'), money(50, 'USD'))).toThrow(/Currency mismatch/);
  });

  it('multiplies by an integer quantity without floating point', () => {
    expect(multiplyMoney(money(89900, 'SGD'), 3)).toEqual({
      amountMinorUnits: 269700,
      currency: 'SGD',
    });
  });

  it('rejects a non-integer multiplier', () => {
    expect(() => multiplyMoney(money(100), 1.5)).toThrow(TypeError);
  });

  it('sums a list of amounts', () => {
    const total = sumMoney([money(89900, 'SGD'), money(5000, 'SGD'), money(1000, 'SGD')]);
    expect(total.amountMinorUnits).toBe(95900);
  });

  it('formats a SGD amount as currency', () => {
    expect(formatMoney(money(89900, 'SGD'))).toContain('899.00');
    expect(formatMoney(money(89900, 'SGD'))).toContain('SGD');
  });
});
