import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ConfigurationsService } from './configurations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentGuestSessionId } from '../../common/decorators/current-guest-session.decorator';

interface CreateConfigurationBody {
  name?: string;
  configuration: unknown;
}

@ApiTags('configurations')
@Controller('configurations')
export class ConfigurationsController {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  @Post()
  async create(
    @Body() body: CreateConfigurationBody,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.configurationsService.create(
      body.configuration,
      { userId: user?.id, guestSessionId },
      body.name,
    );
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.configurationsService.findOwned(id, { userId: user?.id, guestSessionId });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: CreateConfigurationBody,
    @CurrentUser() user: User | undefined,
    @CurrentGuestSessionId() guestSessionId: string | undefined,
  ) {
    return this.configurationsService.update(
      id,
      body.configuration,
      { userId: user?.id, guestSessionId },
      body.name,
    );
  }
}
