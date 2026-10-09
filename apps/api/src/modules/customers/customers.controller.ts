import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Address, CustomerProfile, User } from '@prisma/client';
import { CustomersService } from './customers.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(AuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  async getMe(
    @CurrentUser() user: User,
  ): Promise<{ id: string; email: string; profile: CustomerProfile | null }> {
    const profile = await this.customersService.getProfile(user.id);
    return { id: user.id, email: user.email, profile };
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<CustomerProfile> {
    return this.customersService.updateProfile(user.id, dto);
  }

  @Get('me/addresses')
  async listAddresses(@CurrentUser() user: User): Promise<Address[]> {
    return this.customersService.listAddresses(user.id);
  }

  @Post('me/addresses')
  async createAddress(@CurrentUser() user: User, @Body() dto: CreateAddressDto): Promise<Address> {
    return this.customersService.createAddress(user.id, dto);
  }

  @Patch('me/addresses/:id')
  async updateAddress(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<Address> {
    return this.customersService.updateAddress(user.id, id, dto);
  }

  @Delete('me/addresses/:id')
  async deleteAddress(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.customersService.deleteAddress(user.id, id);
    return { deleted: true };
  }
}
