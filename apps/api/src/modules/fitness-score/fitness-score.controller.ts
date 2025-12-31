import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FitnessScoreService } from './fitness-score.service';
import { ClerkAuthGuard, AuthenticatedUser } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('fitness-score')
@UseGuards(ClerkAuthGuard)
export class FitnessScoreController {
  constructor(private fitnessScoreService: FitnessScoreService) {}

  @Get()
  async getScore(@CurrentUser() user: AuthenticatedUser) {
    return this.fitnessScoreService.getLatestScore(user.id);
  }

  @Get('history')
  async getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.fitnessScoreService.getScoreHistory(user.id);
  }

  @Post('calculate')
  async calculate(@CurrentUser() user: AuthenticatedUser) {
    return this.fitnessScoreService.calculateScore(user.id);
  }
}
