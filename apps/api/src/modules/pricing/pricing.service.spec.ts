import { PricingService } from './pricing.service';
import { PrismaService } from '../../prisma/prisma.service';

function createMockPrisma(options: {
  basePriceMinorUnits: number;
  currency: string;
  rules: { type: string; scopeKey: string | null; amountMinorUnits: number }[];
}) {
  const prisma = {
    product: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'product-1',
        basePriceMinorUnits: options.basePriceMinorUnits,
        currency: options.currency,
      }),
    },
    pricingRule: {
      findMany: jest.fn().mockResolvedValue(options.rules),
    },
  } as unknown as PrismaService;
  return prisma;
}

describe('PricingService', () => {
  it('sums base + finish surcharge + design tier fee + shipping using integer minor units', async () => {
    const prisma = createMockPrisma({
      basePriceMinorUnits: 89900,
      currency: 'SGD',
      rules: [
        { type: 'FINISH_SURCHARGE', scopeKey: 'CHROME', amountMinorUnits: 15000 },
        { type: 'DESIGN_TIER_FEE', scopeKey: 'FULL_CUSTOM', amountMinorUnits: 25000 },
        { type: 'SHIPPING_FLAT', scopeKey: null, amountMinorUnits: 1200 },
      ],
    });
    const service = new PricingService(prisma);

    const breakdown = await service.priceConfiguration('product-1', 'CHROME', 'FULL_CUSTOM');

    expect(breakdown.base).toEqual({ amountMinorUnits: 89900, currency: 'SGD' });
    expect(breakdown.finishSurcharge).toEqual({ amountMinorUnits: 15000, currency: 'SGD' });
    expect(breakdown.designTierFee).toEqual({ amountMinorUnits: 25000, currency: 'SGD' });
    expect(breakdown.shipping).toEqual({ amountMinorUnits: 1200, currency: 'SGD' });
    // 89900 + 15000 + 25000 + 1200 = 131100
    expect(breakdown.total).toEqual({ amountMinorUnits: 131100, currency: 'SGD' });
    expect(Number.isInteger(breakdown.total.amountMinorUnits)).toBe(true);
  });

  it('defaults surcharge/fee/shipping to zero when no matching PricingRule exists', async () => {
    const prisma = createMockPrisma({ basePriceMinorUnits: 89900, currency: 'SGD', rules: [] });
    const service = new PricingService(prisma);

    const breakdown = await service.priceConfiguration('product-1', 'GLOSS', 'PREMADE');

    expect(breakdown.total.amountMinorUnits).toBe(89900);
  });

  it('respects a BASE_PRICE_OVERRIDE rule over Product.basePriceMinorUnits', async () => {
    const prisma = createMockPrisma({
      basePriceMinorUnits: 89900,
      currency: 'SGD',
      rules: [{ type: 'BASE_PRICE_OVERRIDE', scopeKey: null, amountMinorUnits: 75000 }],
    });
    const service = new PricingService(prisma);

    const breakdown = await service.priceConfiguration('product-1', 'GLOSS', 'PREMADE');

    expect(breakdown.base.amountMinorUnits).toBe(75000);
    expect(breakdown.total.amountMinorUnits).toBe(75000);
  });
});
