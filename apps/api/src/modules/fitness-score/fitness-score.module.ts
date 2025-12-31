import { Module } from '@nestjs/common';
import { FitnessScoreController } from './fitness-score.controller';
import { FitnessScoreService } from './fitness-score.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FitnessScoreController],
  providers: [FitnessScoreService],
  exports: [FitnessScoreService],
})
export class FitnessScoreModule {}
