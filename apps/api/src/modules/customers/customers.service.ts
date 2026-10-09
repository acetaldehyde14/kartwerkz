import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Address, CustomerProfile } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<CustomerProfile | null> {
    return this.prisma.customerProfile.findUnique({ where: { userId } });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<CustomerProfile> {
    return this.prisma.customerProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }

  async listAddresses(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<Address> {
    return this.prisma.address.create({ data: { userId, ...dto } });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto): Promise<Address> {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException('Not your address');
    return this.prisma.address.update({ where: { id: addressId }, data: { ...dto } });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException('Not your address');
    await this.prisma.address.delete({ where: { id: addressId } });
  }
}
