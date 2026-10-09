import { Injectable, NotFoundException } from '@nestjs/common';
import { addMoney, money, type Money } from '@kartwerkz/shared';
import { GraphicsDesignTier, MaterialFinish, PricingRule } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface PriceBreakdown {
  base: Money;
  finishSurcharge: Money;
  designTierFee: Money;
  shipping: Money;
  total: Money;
  currency: string;
}

/**
 * The pricing engine. All inputs/outputs are integer minor units — never
 * floats. Base price + finish surcharge + design tier fee + shipping, all
 * scoped per-product and admin-configurable via PricingRule rows.
 * See docs/architecture.md#pricing-engine.
 */
@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async priceConfiguration(
    productId: string,
    finish: MaterialFinish,
    designTier: GraphicsDesignTier,
  ): Promise<PriceBreakdown> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const rules = await this.prisma.pricingRule.findMany({
      where: { productId, isActive: true },
    });

    const currency = product.currency;
    const baseOverride = rules.find((r) => r.type === 'BASE_PRICE_OVERRIDE' && !r.scopeKey);
    const base = money(
      baseOverride ? baseOverride.amountMinorUnits : product.basePriceMinorUnits,
      currency,
    );

    const finishRule = rules.find((r) => r.type === 'FINISH_SURCHARGE' && r.scopeKey === finish);
    const finishSurcharge = money(finishRule?.amountMinorUnits ?? 0, currency);

    const tierRule = rules.find((r) => r.type === 'DESIGN_TIER_FEE' && r.scopeKey === designTier);
    const designTierFee = money(tierRule?.amountMinorUnits ?? 0, currency);

    const shippingRule = rules.find((r) => r.type === 'SHIPPING_FLAT' && !r.scopeKey);
    const shipping = money(shippingRule?.amountMinorUnits ?? 0, currency);

    const total = addMoney(addMoney(addMoney(base, finishSurcharge), designTierFee), shipping);

    return { base, finishSurcharge, designTierFee, shipping, total, currency };
  }

  async listRules(productId?: string): Promise<PricingRule[]> {
    return this.prisma.pricingRule.findMany({
      where: productId ? { productId } : undefined,
      orderBy: [{ productId: 'asc' }, { type: 'asc' }],
    });
  }

  async createRule(data: {
    productId: string;
    type: PricingRule['type'];
    scopeKey?: string;
    amountMinorUnits: number;
    currency?: string;
  }): Promise<PricingRule> {
    return this.prisma.pricingRule.create({
      data: {
        productId: data.productId,
        type: data.type,
        scopeKey: data.scopeKey,
        amountMinorUnits: data.amountMinorUnits,
        currency: data.currency ?? 'SGD',
      },
    });
  }

  async updateRule(
    id: string,
    data: Partial<{ scopeKey: string | null; amountMinorUnits: number; isActive: boolean }>,
  ): Promise<PricingRule> {
    const existing = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pricing rule not found');
    return this.prisma.pricingRule.update({ where: { id }, data });
  }
}
