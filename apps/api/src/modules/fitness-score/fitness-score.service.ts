import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ScoreComponents {
  consistency: number;      // Check-in streak factor (0-25)
  awareness: number;        // Bias detection engagement (0-25)
  progress: number;         // Reduction in bias intensity (0-25)
  engagement: number;       // Chat frequency and depth (0-25)
}

@Injectable()
export class FitnessScoreService {
  constructor(private prisma: PrismaService) {}

  async calculateScore(userId: string): Promise<{ score: number; components: ScoreComponents }> {
    const [streak, recentConversations, olderConversations] = await Promise.all([
      this.prisma.userStreak.findUnique({ where: { userId } }),
      this.prisma.conversation.findMany({
        where: {
          userId,
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: { messages: true },
      }),
      this.prisma.conversation.findMany({
        where: {
          userId,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Consistency (0-25): Based on streak
    const consistency = Math.min(25, (streak?.currentStreak || 0) * 2.5);

    // Awareness (0-25): Based on conversations with detected biases
    const convosWithBiases = recentConversations.filter(c => {
      const biases = c.biases as any[] | null;
      return biases && biases.length > 0;
    });
    const awareness = Math.min(25, convosWithBiases.length * 5);

    // Progress (0-25): Compare recent vs older bias intensity
    const recentIntensity = this.avgBiasIntensity(recentConversations);
    const olderIntensity = this.avgBiasIntensity(olderConversations);
    const improvement = olderIntensity > 0 ? ((olderIntensity - recentIntensity) / olderIntensity) * 100 : 0;
    const progress = Math.min(25, Math.max(0, improvement / 4 + 12.5)); // Baseline of 12.5

    // Engagement (0-25): Based on message count
    const totalMessages = recentConversations.reduce((sum, c) => {
      return sum + (c.messages?.length || 0);
    }, 0);
    const engagement = Math.min(25, totalMessages * 0.5);

    const components = {
      consistency: Math.round(consistency),
      awareness: Math.round(awareness),
      progress: Math.round(progress),
      engagement: Math.round(engagement),
    };
    const score = Math.round(consistency + awareness + progress + engagement);

    // Save to history
    await this.prisma.mentalFitnessScore.create({
      data: { userId, score, components },
    });

    return { score, components };
  }

  private avgBiasIntensity(conversations: any[]): number {
    let total = 0;
    let count = 0;
    conversations.forEach(c => {
      const biases = (c.biases as Array<{ intensity?: number; confidence?: number }>) || [];
      biases.forEach(b => {
        total += b.intensity || (b.confidence ? b.confidence * 100 : 50);
        count++;
      });
    });
    return count > 0 ? total / count : 0;
  }

  async getLatestScore(userId: string) {
    const latest = await this.prisma.mentalFitnessScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    });

    // If no score or score is older than 24 hours, calculate new one
    if (!latest || Date.now() - latest.calculatedAt.getTime() > 24 * 60 * 60 * 1000) {
      return this.calculateScore(userId);
    }

    return {
      score: latest.score,
      components: latest.components as unknown as ScoreComponents,
    };
  }

  async getScoreHistory(userId: string, limit = 30) {
    return this.prisma.mentalFitnessScore.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    });
  }
}
