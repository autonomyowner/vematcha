import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ClerkAuthGuard, AuthenticatedUser } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(ClerkAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getDashboard(user.id);
  }

  @Get('export')
  async exportInsights(
    @CurrentUser() user: AuthenticatedUser,
    @Query('format') format: 'json' | 'csv' | 'print' = 'json',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardService.exportUserData(user.id, format, from, to);
  }
}
