import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ClerkAuthGuard, AuthenticatedUser } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(ClerkAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  async getReports(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getUserReports(user.id);
  }

  @Get(':id')
  async getReport(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reportsService.getReportById(user.id, id);
  }

  @Post('generate')
  async generateReport(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.triggerReportGeneration(user.id);
  }
}
