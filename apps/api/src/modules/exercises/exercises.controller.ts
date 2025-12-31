import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { ClerkAuthGuard, AuthenticatedUser } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('exercises')
@UseGuards(ClerkAuthGuard)
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Get()
  async getExercises(
    @CurrentUser() user: AuthenticatedUser,
    @Query('includeCompleted') includeCompleted?: string,
  ) {
    return this.exercisesService.getUserExercises(
      user.id,
      includeCompleted === 'true',
    );
  }

  @Get(':id')
  async getExercise(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.exercisesService.getExerciseById(user.id, id);
  }

  @Post('generate')
  async generateExercise(@CurrentUser() user: AuthenticatedUser, @Body() body: { biasType: string }) {
    return this.exercisesService.generateExercise(user.id, body.biasType);
  }

  @Post('generate-from-recent')
  async generateFromRecent(@CurrentUser() user: AuthenticatedUser) {
    return this.exercisesService.generateFromRecentBiases(user.id);
  }

  @Patch(':id/complete')
  async completeExercise(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.exercisesService.completeExercise(user.id, id);
  }
}
