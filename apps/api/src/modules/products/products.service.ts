import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        kartModels: {
          include: { kartModel: { include: { manufacturer: true } } },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return {
      ...product,
      kartModels: product.kartModels.map((pkm) => pkm.kartModel),
    };
  }
}
