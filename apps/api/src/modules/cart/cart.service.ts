import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cart, CartItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { OwnerContext } from '../configurations/configurations.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  private whereOwner(owner: OwnerContext) {
    if (owner.userId) return { userId: owner.userId };
    if (owner.guestSessionId) return { guestSessionId: owner.guestSessionId };
    throw new BadRequestException('No user or guest session context available');
  }

  async getOrCreateCart(owner: OwnerContext): Promise<Cart> {
    const where = this.whereOwner(owner);
    const existing = await this.prisma.cart.findFirst({ where });
    if (existing) return existing;
    return this.prisma.cart.create({
      data: owner.userId ? { userId: owner.userId } : { guestSessionId: owner.guestSessionId },
    });
  }

  async getCart(owner: OwnerContext) {
    const cart = await this.getOrCreateCart(owner);
    return this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true, savedConfiguration: true } } },
    });
  }

  private assertItemOwnership(item: CartItem & { cart: Cart }, owner: OwnerContext): void {
    const ownedByUser = owner.userId && item.cart.userId === owner.userId;
    const ownedByGuest = owner.guestSessionId && item.cart.guestSessionId === owner.guestSessionId;
    if (!ownedByUser && !ownedByGuest) {
      throw new ForbiddenException('This cart item does not belong to you');
    }
  }

  async addItem(
    owner: OwnerContext,
    productId: string,
    savedConfigurationId: string,
    quantity: number,
  ) {
    const config = await this.prisma.savedConfiguration.findUnique({
      where: { id: savedConfigurationId },
      include: { graphicsDesign: true },
    });
    if (!config) throw new NotFoundException('Configuration not found');
    const ownedByUser = owner.userId && config.userId === owner.userId;
    const ownedByGuest = owner.guestSessionId && config.guestSessionId === owner.guestSessionId;
    if (!ownedByUser && !ownedByGuest) {
      throw new ForbiddenException('This configuration does not belong to you');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    // Price is ALWAYS computed server-side — never trust a client-submitted price.
    const breakdown = await this.pricingService.priceConfiguration(
      productId,
      config.finish,
      config.graphicsDesign.tier,
    );

    const cart = await this.getOrCreateCart(owner);
    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        savedConfigurationId,
        quantity,
        unitPriceMinorUnits: breakdown.total.amountMinorUnits,
        currency: breakdown.currency,
      },
    });
  }

  async updateItemQuantity(owner: OwnerContext, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    this.assertItemOwnership(item, owner);
    return this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  async removeItem(owner: OwnerContext, itemId: string): Promise<void> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    this.assertItemOwnership(item, owner);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }
}
