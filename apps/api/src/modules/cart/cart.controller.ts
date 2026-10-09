import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-item.dto';
import { UpdateCartItemDto } from './dto/update-item.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentGuestSessionId } from '../../common/decorators/current-guest-session.decorator';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.cartService.getCart({ userId: user?.id, guestSessionId });
  }

  @Post('items')
  async addItem(
    @Body() dto: AddCartItemDto,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.cartService.addItem(
      { userId: user?.id, guestSessionId },
      dto.productId,
      dto.savedConfigurationId,
      dto.quantity,
    );
  }

  @Patch('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.cartService.updateItemQuantity(
      { userId: user?.id, guestSessionId },
      id,
      dto.quantity,
    );
  }

  @Delete('items/:id')
  async removeItem(
    @Param('id') id: string,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    await this.cartService.removeItem({ userId: user?.id, guestSessionId }, id);
    return { deleted: true };
  }
}
