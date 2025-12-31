import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StreaksService {
  constructor(private prisma: PrismaService) {}

  async getStreak(userId: string) {
    let streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await this.prisma.userStreak.create({
        data: { userId },
      });
    }

    return streak;
  }

  async recordCheckIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const streak = await this.getStreak(userId);
    const lastCheckIn = streak.lastCheckInDate
      ? new Date(streak.lastCheckInDate)
      : null;

    // Already checked in today
    if (lastCheckIn) {
      lastCheckIn.setHours(0, 0, 0, 0);
      if (lastCheckIn.getTime() === today.getTime()) {
        return { ...streak, alreadyCheckedIn: true, streakIncreased: false };
      }
    }

    // Calculate if streak continues
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isConsecutive = lastCheckIn && lastCheckIn.getTime() === yesterday.getTime();
    const newCurrentStreak = isConsecutive ? streak.currentStreak + 1 : 1;
    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    const updated = await this.prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCheckInDate: today,
        totalCheckIns: streak.totalCheckIns + 1,
      },
    });

    return { ...updated, alreadyCheckedIn: false, streakIncreased: isConsecutive };
  }

  async getLeaderboard(limit = 10) {
    return this.prisma.userStreak.findMany({
      take: limit,
      orderBy: { currentStreak: 'desc' },
      include: {
        user: {
          select: { firstName: true },
        },
      },
    });
  }
}
