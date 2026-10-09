import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PricingRule, User } from '@prisma/client';
import { PricingService } from './pricing.service';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('admin-pricing')
@Controller('admin/pricing-rules')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async list(@Query('productId') productId?: string): Promise<PricingRule[]> {
    return this.pricingService.listRules(productId);
  }

  @Post()
  async create(@Body() dto: CreatePricingRuleDto, @CurrentUser() user: User): Promise<PricingRule> {
    const rule = await this.pricingService.createRule(dto);
    await this.auditService.log(user.id, 'pricing_rule.create', 'PricingRule', rule.id, { ...dto });
    return rule;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePricingRuleDto,
    @CurrentUser() user: User,
  ): Promise<PricingRule> {
    const rule = await this.pricingService.updateRule(id, dto);
    await this.auditService.log(user.id, 'pricing_rule.update', 'PricingRule', rule.id, { ...dto });
    return rule;
  }
}
