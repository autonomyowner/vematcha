import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterProvider } from '../../providers/ai/openrouter.provider';
import { Prisma } from '@prisma/client';

const EXERCISE_PROMPT = `You are a CBT therapist. Generate a practical 5-minute exercise for someone exhibiting "{bias}" cognitive bias.

Return ONLY valid JSON with this exact structure:
{
  "title": "Short catchy title (5 words max)",
  "description": "2-sentence explanation of what this exercise does",
  "steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "estimatedMinutes": 5
}

Make it actionable, specific, and completable right now. No vague advice. Focus on practical CBT techniques.`;

interface GeneratedExercise {
  title: string;
  description: string;
  steps: string[];
  estimatedMinutes: number;
}

@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  constructor(
    private prisma: PrismaService,
    private ai: OpenRouterProvider,
  ) {}

  async generateExercise(userId: string, biasType: string) {
    const prompt = EXERCISE_PROMPT.replace('{bias}', biasType);

    this.logger.log(`Generating exercise for bias: ${biasType}`);

    try {
      const response = await this.ai.chat([
        { role: 'system', content: 'You are a CBT therapist. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ]);

      let exerciseData: GeneratedExercise;
      try {
        exerciseData = JSON.parse(response.message);
      } catch {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = response.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          exerciseData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse exercise response');
        }
      }

      return this.prisma.exercise.create({
        data: {
          userId,
          biasType,
          title: exerciseData.title,
          description: exerciseData.description,
          steps: exerciseData.steps,
          estimatedMinutes: exerciseData.estimatedMinutes || 5,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to generate exercise: ${error}`);
      throw error;
    }
  }

  async getUserExercises(userId: string, includeCompleted = false) {
    return this.prisma.exercise.findMany({
      where: {
        userId,
        ...(includeCompleted ? {} : { completed: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async completeExercise(userId: string, exerciseId: string) {
    return this.prisma.exercise.update({
      where: { id: exerciseId, userId },
      data: { completed: true, completedAt: new Date() },
    });
  }

  async generateFromRecentBiases(userId: string) {
    // Get most recent conversation with biases
    const recentConvo = await this.prisma.conversation.findFirst({
      where: { userId, biases: { not: Prisma.JsonNull } },
      orderBy: { updatedAt: 'desc' },
    });

    if (!recentConvo?.biases) {
      return null;
    }

    const biases = recentConvo.biases as Array<{ name?: string; type?: string; intensity?: number }>;
    if (biases.length === 0) return null;

    // Generate exercise for the highest-intensity bias
    const topBias = biases.sort((a, b) => (b.intensity || 0) - (a.intensity || 0))[0];
    const biasName = topBias.name || topBias.type || 'cognitive distortion';

    return this.generateExercise(userId, biasName);
  }

  async getExerciseById(userId: string, exerciseId: string) {
    return this.prisma.exercise.findFirst({
      where: { id: exerciseId, userId },
    });
  }
}
