import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list() {
    return this.productsService.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }
}
