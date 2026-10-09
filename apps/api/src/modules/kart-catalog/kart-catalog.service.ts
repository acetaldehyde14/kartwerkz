import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KartCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listManufacturers() {
    return this.prisma.kartManufacturer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async listModels(manufacturerId?: string) {
    return this.prisma.kartModel.findMany({
      where: {
        isActive: true,
        ...(manufacturerId ? { manufacturerId } : {}),
      },
      include: { manufacturer: true },
      orderBy: { name: 'asc' },
    });
  }
}
