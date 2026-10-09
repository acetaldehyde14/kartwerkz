import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentGuestSessionId } from '../../common/decorators/current-guest-session.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(AuthGuard)
  async list(@CurrentUser() user: User) {
    return this.ordersService.listForUser(user.id);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.ordersService.findForOwner(id, { userId: user?.id, guestSessionId });
  }
}
