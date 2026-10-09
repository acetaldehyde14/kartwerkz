import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GraphicsDesignsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(kartModelId?: string) {
    return this.prisma.graphicsDesign.findMany({
      where: {
        isActive: true,
        ...(kartModelId ? { compatibleKartModels: { some: { kartModelId } } } : {}),
      },
      include: { assets: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
