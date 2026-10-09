import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { type AdminDashboard } from './admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async dashboard(): Promise<AdminDashboard> {
    return this.adminService.dashboard();
  }
}
