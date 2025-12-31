import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StreaksService } from './streaks.service';
import { ClerkAuthGuard, AuthenticatedUser } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('streaks')
@UseGuards(ClerkAuthGuard)
export class StreaksController {
  constructor(private streaksService: StreaksService) {}

  @Get()
  async getStreak(@CurrentUser() user: AuthenticatedUser) {
    return this.streaksService.getStreak(user.id);
  }

  @Post('check-in')
  async checkIn(@CurrentUser() user: AuthenticatedUser) {
    return this.streaksService.recordCheckIn(user.id);
  }
}
