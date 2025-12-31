# Matcha Value Increase Features Implementation Plan

## Goal
Increase the perceived and actual value of Matcha's $19/month Pro tier by adding tangible deliverables, gamification, and structured programs that differentiate it from raw ChatGPT usage.

## Architecture
We'll extend the existing NestJS API with new modules (streaks, exercises, reports, programs) and add corresponding Prisma models. The frontend will get new dashboard sections and dedicated pages. We'll use Bull queues for async report generation and email delivery via a new email provider.

## Tech Stack
- **Backend**: NestJS 10.x, Prisma 5.x, PostgreSQL, Bull queues, Redis
- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **New Dependencies**:
  - `@react-pdf/renderer` (PDF generation)
  - `@nestjs/schedule` (cron jobs for weekly reports)
  - `nodemailer` or `resend` (email delivery)
- **Existing Patterns**: Follow `analyses.module.ts` structure, use `AuthGuard` for protected routes

---

# Tier 1: Quick Wins

---

## Feature 1: Daily Check-in Streaks

### 1.1 Database Schema

**File:** `apps/api/prisma/schema.prisma`

```prisma
model UserStreak {
  id              String   @id @default(cuid())
  userId          String   @unique @map("user_id")
  currentStreak   Int      @default(0) @map("current_streak")
  longestStreak   Int      @default(0) @map("longest_streak")
  lastCheckInDate DateTime? @map("last_check_in_date") @db.Date
  totalCheckIns   Int      @default(0) @map("total_check_ins")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_streaks")
}
```

Update User model to add relation:
```prisma
model User {
  // ... existing fields
  streak UserStreak?
}
```

**Verification:** `npx prisma migrate dev --name add-user-streaks`

---

### 1.2 Backend - Streaks Module

**File:** `apps/api/src/modules/streaks/streaks.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { StreaksController } from './streaks.controller';
import { StreaksService } from './streaks.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StreaksController],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
```

---

**File:** `apps/api/src/modules/streaks/streaks.service.ts`

```typescript
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
    if (lastCheckIn && lastCheckIn.getTime() === today.getTime()) {
      return { ...streak, alreadyCheckedIn: true };
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
```

---

**File:** `apps/api/src/modules/streaks/streaks.controller.ts`

```typescript
import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { StreaksService } from './streaks.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('streaks')
@UseGuards(AuthGuard)
export class StreaksController {
  constructor(private streaksService: StreaksService) {}

  @Get()
  async getStreak(@Req() req: any) {
    return this.streaksService.getStreak(req.userId);
  }

  @Post('check-in')
  async checkIn(@Req() req: any) {
    return this.streaksService.recordCheckIn(req.userId);
  }
}
```

---

### 1.3 Frontend - Streak Component

**File:** `apps/client/src/components/StreakCard.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string | null;
}

export function StreakCard() {
  const { getToken } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/streaks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStreak(data);

      // Check if already checked in today
      if (data.lastCheckInDate) {
        const lastDate = new Date(data.lastCheckInDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);
        setCheckedInToday(lastDate.getTime() === today.getTime());
      }
    } catch (err) {
      console.error('Failed to fetch streak:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/streaks/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStreak(data);
      setCheckedInToday(true);
    } catch (err) {
      console.error('Check-in failed:', err);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-4" style={{ background: 'var(--cream-100)' }}>
        <div className="animate-pulse h-20" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, var(--matcha-100) 0%, var(--cream-50) 100%)',
        border: '1px solid var(--matcha-200)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          Daily Streak
        </h3>
        <div
          className="text-3xl font-bold"
          style={{ color: 'var(--matcha-600)' }}
        >
          {streak?.currentStreak || 0}
        </div>
      </div>

      <div className="flex gap-4 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        <div>
          <span className="font-medium" style={{ color: 'var(--matcha-700)' }}>
            {streak?.longestStreak || 0}
          </span>{' '}
          best streak
        </div>
        <div>
          <span className="font-medium" style={{ color: 'var(--matcha-700)' }}>
            {streak?.totalCheckIns || 0}
          </span>{' '}
          total check-ins
        </div>
      </div>

      <button
        onClick={handleCheckIn}
        disabled={checkedInToday || checkingIn}
        className="w-full py-2.5 rounded-xl font-medium transition-all"
        style={{
          background: checkedInToday ? 'var(--cream-200)' : 'var(--matcha-500)',
          color: checkedInToday ? 'var(--text-muted)' : 'white',
          cursor: checkedInToday ? 'default' : 'pointer',
        }}
      >
        {checkedInToday ? 'Checked in today' : checkingIn ? 'Checking in...' : 'Check In'}
      </button>
    </div>
  );
}
```

**Commit:** `feat(streaks): add daily check-in streak tracking`

---

## Feature 2: AI-Generated Exercises

### 2.1 Database Schema

**File:** `apps/api/prisma/schema.prisma`

```prisma
model Exercise {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  biasType        String   @map("bias_type")  // e.g., "catastrophizing", "all-or-nothing"
  title           String
  description     String   @db.Text
  steps           Json     // Array of step strings
  estimatedMinutes Int     @default(5) @map("estimated_minutes")
  completed       Boolean  @default(false)
  completedAt     DateTime? @map("completed_at")
  createdAt       DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, completed])
  @@map("exercises")
}
```

Update User model:
```prisma
model User {
  // ... existing
  exercises Exercise[]
}
```

**Verification:** `npx prisma migrate dev --name add-exercises`

---

### 2.2 Backend - Exercises Module

**File:** `apps/api/src/modules/exercises/exercises.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIService } from '../../providers/ai/ai.service';

const EXERCISE_PROMPT = `You are a CBT therapist. Generate a practical 5-minute exercise for someone exhibiting "{bias}" cognitive bias.

Return JSON with:
{
  "title": "Short catchy title (5 words max)",
  "description": "2-sentence explanation of what this exercise does",
  "steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "estimatedMinutes": 5
}

Make it actionable, specific, and completable right now. No vague advice.`;

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private ai: AIService,
  ) {}

  async generateExercise(userId: string, biasType: string) {
    const prompt = EXERCISE_PROMPT.replace('{bias}', biasType);

    const response = await this.ai.generateJSON(prompt);

    return this.prisma.exercise.create({
      data: {
        userId,
        biasType,
        title: response.title,
        description: response.description,
        steps: response.steps,
        estimatedMinutes: response.estimatedMinutes || 5,
      },
    });
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
      where: { userId, biases: { not: null } },
      orderBy: { updatedAt: 'desc' },
    });

    if (!recentConvo?.biases) {
      return null;
    }

    const biases = recentConvo.biases as any[];
    if (biases.length === 0) return null;

    // Generate exercise for the highest-intensity bias
    const topBias = biases.sort((a, b) => b.intensity - a.intensity)[0];
    return this.generateExercise(userId, topBias.name || topBias.type);
  }
}
```

---

**File:** `apps/api/src/modules/exercises/exercises.controller.ts`

```typescript
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('exercises')
@UseGuards(AuthGuard)
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Get()
  async getExercises(
    @Req() req: any,
    @Query('includeCompleted') includeCompleted?: string,
  ) {
    return this.exercisesService.getUserExercises(
      req.userId,
      includeCompleted === 'true',
    );
  }

  @Post('generate')
  async generateExercise(@Req() req: any, @Body() body: { biasType: string }) {
    return this.exercisesService.generateExercise(req.userId, body.biasType);
  }

  @Post('generate-from-recent')
  async generateFromRecent(@Req() req: any) {
    return this.exercisesService.generateFromRecentBiases(req.userId);
  }

  @Patch(':id/complete')
  async completeExercise(@Req() req: any, @Param('id') id: string) {
    return this.exercisesService.completeExercise(req.userId, id);
  }
}
```

---

### 2.3 Auto-Generate After Chat Analysis

**File:** `apps/api/src/modules/chat/chat.service.ts` (modify existing)

After the real-time analysis updates biases, add:

```typescript
// In the method that updates conversation analysis
// After saving biases to conversation:

// Generate exercise suggestion (non-blocking)
this.exercisesService.generateFromRecentBiases(userId).catch(err => {
  console.error('Failed to generate exercise:', err);
});
```

**Commit:** `feat(exercises): add AI-generated CBT exercises based on detected biases`

---

## Feature 3: Exportable Insights Journal

### 3.1 Backend - Export Endpoint

**File:** `apps/api/src/modules/dashboard/dashboard.controller.ts` (add to existing)

```typescript
@Get('export')
async exportInsights(
  @Req() req: any,
  @Query('format') format: 'json' | 'csv' = 'json',
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  return this.dashboardService.exportUserData(req.userId, format, from, to);
}
```

---

**File:** `apps/api/src/modules/dashboard/dashboard.service.ts` (add method)

```typescript
async exportUserData(
  userId: string,
  format: 'json' | 'csv',
  fromDate?: string,
  toDate?: string,
) {
  const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = toDate ? new Date(toDate) : new Date();

  const [conversations, analyses] = await Promise.all([
    this.prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { gte: from, lte: to },
      },
      include: { messages: true },
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.analysis.findMany({
      where: {
        userId,
        createdAt: { gte: from, lte: to },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    period: { from: from.toISOString(), to: to.toISOString() },
    summary: {
      totalConversations: conversations.length,
      totalAnalyses: analyses.length,
    },
    conversations: conversations.map(c => ({
      id: c.id,
      date: c.createdAt,
      messageCount: c.messages.length,
      biases: c.biases,
      patterns: c.patterns,
      emotionalState: c.emotionalState,
      insights: c.insights,
    })),
    analyses: analyses.map(a => ({
      id: a.id,
      date: a.createdAt,
      input: a.inputText.substring(0, 200) + '...',
      biases: a.biases,
      patterns: a.patterns,
      insights: a.insights,
    })),
  };

  if (format === 'csv') {
    return this.convertToCSV(exportData);
  }

  return exportData;
}

private convertToCSV(data: any): string {
  const rows = [
    ['Date', 'Type', 'Biases', 'Patterns', 'Key Insight'],
  ];

  data.conversations.forEach((c: any) => {
    rows.push([
      new Date(c.date).toISOString().split('T')[0],
      'Chat',
      JSON.stringify(c.biases || []),
      JSON.stringify(c.patterns || {}),
      (c.insights || [])[0] || '',
    ]);
  });

  return rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
}
```

---

### 3.2 Frontend - Export Button

**File:** `apps/client/src/components/ExportButton.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export function ExportButton() {
  const { getToken } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/export?format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = format === 'json' ? await res.json() : await res.text();

      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data, null, 2) : data],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matcha-insights-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('json')}
        disabled={exporting}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{
          background: 'var(--cream-200)',
          color: 'var(--text-primary)',
        }}
      >
        Export JSON
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={exporting}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{
          background: 'var(--cream-200)',
          color: 'var(--text-primary)',
        }}
      >
        Export CSV
      </button>
    </div>
  );
}
```

**Commit:** `feat(export): add exportable insights journal in JSON/CSV formats`

---

# Tier 2: Medium Investment

---

## Feature 4: Weekly PDF Profile Report

### 4.1 Install Dependencies

```bash
cd apps/api
npm install @nestjs/schedule pdfkit nodemailer
npm install -D @types/pdfkit @types/nodemailer
```

---

### 4.2 Database - Report Tracking

**File:** `apps/api/prisma/schema.prisma`

```prisma
model WeeklyReport {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  weekStart   DateTime @map("week_start") @db.Date
  weekEnd     DateTime @map("week_end") @db.Date
  fileUrl     String?  @map("file_url")
  emailSentAt DateTime? @map("email_sent_at")
  createdAt   DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, weekStart])
  @@map("weekly_reports")
}

// Add to User model:
// weeklyReports WeeklyReport[]
```

---

### 4.3 Backend - Reports Module

**File:** `apps/api/src/modules/reports/reports.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../providers/storage/storage.service';
import { EmailService } from '../../providers/email/email.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private email: EmailService,
  ) {}

  // Run every Sunday at 9 AM
  @Cron('0 9 * * 0')
  async generateWeeklyReports() {
    const proUsers = await this.prisma.user.findMany({
      where: { tier: 'PRO' },
    });

    for (const user of proUsers) {
      try {
        await this.generateReportForUser(user.id);
      } catch (err) {
        console.error(`Failed to generate report for ${user.id}:`, err);
      }
    }
  }

  async generateReportForUser(userId: string) {
    const weekEnd = new Date();
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Gather week's data
    const [conversations, user, streak] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          userId,
          updatedAt: { gte: weekStart, lte: weekEnd },
          biases: { not: null },
        },
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
    ]);

    // Aggregate biases
    const biasMap = new Map<string, { count: number; totalIntensity: number }>();
    conversations.forEach(c => {
      const biases = (c.biases as any[]) || [];
      biases.forEach(b => {
        const existing = biasMap.get(b.name) || { count: 0, totalIntensity: 0 };
        biasMap.set(b.name, {
          count: existing.count + 1,
          totalIntensity: existing.totalIntensity + (b.intensity || 50),
        });
      });
    });

    const topBiases = Array.from(biasMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgIntensity: Math.round(data.totalIntensity / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate PDF
    const pdfBuffer = await this.generatePDF({
      userName: user?.firstName || 'User',
      weekStart,
      weekEnd,
      conversationCount: conversations.length,
      topBiases,
      currentStreak: streak?.currentStreak || 0,
    });

    // Upload to R2
    const fileName = `reports/${userId}/${weekStart.toISOString().split('T')[0]}.pdf`;
    const fileUrl = await this.storage.upload(fileName, pdfBuffer, 'application/pdf');

    // Save record
    const report = await this.prisma.weeklyReport.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        fileUrl,
      },
    });

    // Send email
    if (user?.email) {
      await this.email.send({
        to: user.email,
        subject: `Your Matcha Weekly Insights - ${weekStart.toLocaleDateString()}`,
        html: this.getEmailTemplate(user.firstName, fileUrl),
      });

      await this.prisma.weeklyReport.update({
        where: { id: report.id },
        data: { emailSentAt: new Date() },
      });
    }

    return report;
  }

  private async generatePDF(data: {
    userName: string;
    weekStart: Date;
    weekEnd: Date;
    conversationCount: number;
    topBiases: { name: string; count: number; avgIntensity: number }[];
    currentStreak: number;
  }): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24).fillColor('#4A7C59').text('Matcha Weekly Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).fillColor('#666')
        .text(`${data.weekStart.toLocaleDateString()} - ${data.weekEnd.toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Greeting
      doc.fontSize(16).fillColor('#333').text(`Hello ${data.userName},`);
      doc.moveDown();
      doc.fontSize(11).fillColor('#555')
        .text(`Here's your psychological insights summary for the past week.`);
      doc.moveDown(2);

      // Stats
      doc.fontSize(14).fillColor('#4A7C59').text('Weekly Overview');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#333')
        .text(`Sessions: ${data.conversationCount}`)
        .text(`Current Streak: ${data.currentStreak} days`);
      doc.moveDown(2);

      // Top Biases
      if (data.topBiases.length > 0) {
        doc.fontSize(14).fillColor('#4A7C59').text('Top Cognitive Patterns Detected');
        doc.moveDown(0.5);
        data.topBiases.forEach((bias, i) => {
          doc.fontSize(11).fillColor('#333')
            .text(`${i + 1}. ${bias.name} - ${bias.count}x (avg intensity: ${bias.avgIntensity}%)`);
        });
      }

      doc.moveDown(2);
      doc.fontSize(10).fillColor('#999')
        .text('Generated by Matcha - Your AI Psychological Companion', { align: 'center' });

      doc.end();
    });
  }

  private getEmailTemplate(name: string | null, pdfUrl: string): string {
    return `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4A7C59;">Your Weekly Mind Report</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Your weekly psychological insights report is ready. This summary shows your cognitive patterns and progress from the past 7 days.</p>
        <a href="${pdfUrl}" style="display: inline-block; background: #4A7C59; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Download Your Report
        </a>
        <p style="color: #666; font-size: 14px;">Keep up the self-awareness journey!</p>
        <p style="color: #999; font-size: 12px;">- The Matcha Team</p>
      </div>
    `;
  }
}
```

**Commit:** `feat(reports): add weekly PDF profile reports with email delivery`

---

## Feature 5: Mental Fitness Score

### 5.1 Database Schema

**File:** `apps/api/prisma/schema.prisma`

```prisma
model MentalFitnessScore {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  score           Int      // 0-100
  components      Json     // Breakdown of score factors
  calculatedAt    DateTime @default(now()) @map("calculated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, calculatedAt(sort: Desc)])
  @@map("mental_fitness_scores")
}
```

---

### 5.2 Score Calculation Service

**File:** `apps/api/src/modules/fitness-score/fitness-score.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ScoreComponents {
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
    const convosWithBiases = recentConversations.filter(c => c.biases && (c.biases as any[]).length > 0);
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

    const components = { consistency, awareness, progress, engagement };
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
      const biases = (c.biases as any[]) || [];
      biases.forEach(b => {
        total += b.intensity || 50;
        count++;
      });
    });
    return count > 0 ? total / count : 0;
  }

  async getScoreHistory(userId: string, limit = 30) {
    return this.prisma.mentalFitnessScore.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    });
  }
}
```

**Commit:** `feat(fitness-score): add mental fitness score calculation (0-100)`

---

## Feature 6: Procrastination Deep Dive Program (2 weeks)

### 6.1 Database Schema

**File:** `apps/api/prisma/schema.prisma`

```prisma
model Program {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String   @db.Text
  durationDays Int     @map("duration_days")
  modules     Json     // Array of { day: number, title: string, content: string, exercise: {...} }
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  enrollments ProgramEnrollment[]

  @@map("programs")
}

model ProgramEnrollment {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  programId       String    @map("program_id")
  startedAt       DateTime  @default(now()) @map("started_at")
  currentDay      Int       @default(1) @map("current_day")
  completedDays   Json      @default("[]") @map("completed_days") // Array of completed day numbers
  completedAt     DateTime? @map("completed_at")

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  program Program @relation(fields: [programId], references: [id], onDelete: Cascade)

  @@unique([userId, programId])
  @@map("program_enrollments")
}

// Add to User model:
// programEnrollments ProgramEnrollment[]
```

---

### 6.2 Seed Procrastination Program

**File:** `apps/api/prisma/seed-programs.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const procrastinationProgram = {
  slug: 'procrastination-deep-dive',
  name: 'Procrastination Deep Dive',
  description: 'A 14-day program to understand and overcome your procrastination patterns using CBT techniques.',
  durationDays: 14,
  modules: [
    {
      day: 1,
      title: 'Understanding Your Procrastination',
      content: 'Procrastination isn\'t laziness - it\'s emotional regulation. Today we identify YOUR specific triggers.',
      exercise: {
        title: 'Trigger Mapping',
        steps: [
          'List 3 tasks you\'ve been avoiding',
          'For each, write the emotion you feel when you think about starting',
          'Rate the discomfort 1-10',
          'Notice patterns - is it fear? Overwhelm? Perfectionism?',
        ],
      },
    },
    {
      day: 2,
      title: 'The Comfort Zone Trap',
      content: 'Your brain prefers certainty over growth. We\'ll explore how avoidance creates a false sense of safety.',
      exercise: {
        title: '5-Minute Exposure',
        steps: [
          'Choose your smallest avoided task',
          'Set a timer for exactly 5 minutes',
          'Work on it without stopping',
          'When timer ends, notice: was it as bad as you imagined?',
        ],
      },
    },
    // ... Days 3-14 would continue with progressive exercises
    {
      day: 14,
      title: 'Your Anti-Procrastination System',
      content: 'Consolidate everything you\'ve learned into a personalized system.',
      exercise: {
        title: 'System Design',
        steps: [
          'Write your top 3 procrastination triggers',
          'For each, write your go-to reframe technique',
          'Create a "when I notice X, I will do Y" plan',
          'Schedule a weekly 10-min review in your calendar',
        ],
      },
    },
  ],
};

async function main() {
  await prisma.program.upsert({
    where: { slug: 'procrastination-deep-dive' },
    update: procrastinationProgram,
    create: procrastinationProgram,
  });

  console.log('Programs seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

### 6.3 Programs Controller

**File:** `apps/api/src/modules/programs/programs.controller.ts`

```typescript
import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('programs')
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  @Get()
  async listPrograms() {
    return this.programsService.getActivePrograms();
  }

  @Get(':slug')
  async getProgram(@Param('slug') slug: string) {
    return this.programsService.getProgramBySlug(slug);
  }

  @UseGuards(AuthGuard)
  @Post(':slug/enroll')
  async enroll(@Req() req: any, @Param('slug') slug: string) {
    return this.programsService.enrollUser(req.userId, slug);
  }

  @UseGuards(AuthGuard)
  @Get('enrollments/me')
  async myEnrollments(@Req() req: any) {
    return this.programsService.getUserEnrollments(req.userId);
  }

  @UseGuards(AuthGuard)
  @Patch('enrollments/:programId/complete-day')
  async completeDay(@Req() req: any, @Param('programId') programId: string) {
    return this.programsService.completeCurrentDay(req.userId, programId);
  }
}
```

**Commit:** `feat(programs): add structured CBT programs with procrastination deep dive`

---

# Tier 3: Differentiators

---

## Feature 7: 8-Week CBT Fundamentals Course

This follows the same pattern as Feature 6, but with 56 days of content. Create a similar seed file with comprehensive CBT curriculum:

- Week 1-2: Cognitive Distortions
- Week 3-4: Thought Records
- Week 5-6: Behavioral Activation
- Week 7-8: Relapse Prevention

**Commit:** `feat(programs): add 8-week CBT fundamentals course`

---

## Feature 8: Pattern-Based Smart Notifications

### 8.1 Database Schema

**File:** `apps/api/prisma/schema.prisma`

```prisma
model NotificationPreference {
  id              String   @id @default(cuid())
  userId          String   @unique @map("user_id")
  pushEnabled     Boolean  @default(true) @map("push_enabled")
  emailDigest     Boolean  @default(true) @map("email_digest")
  insightAlerts   Boolean  @default(true) @map("insight_alerts")
  streakReminders Boolean  @default(true) @map("streak_reminders")
  quietHoursStart Int?     @map("quiet_hours_start") // Hour 0-23
  quietHoursEnd   Int?     @map("quiet_hours_end")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}

model ScheduledNotification {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  type        String    // 'streak_reminder' | 'insight' | 'program_day'
  title       String
  body        String
  scheduledFor DateTime @map("scheduled_for")
  sentAt      DateTime? @map("sent_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@index([scheduledFor, sentAt])
  @@map("scheduled_notifications")
}
```

---

### 8.2 Notification Service

**File:** `apps/api/src/modules/notifications/notifications.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Check for users about to lose their streak (7 PM daily)
  @Cron('0 19 * * *')
  async sendStreakReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users with streaks who haven't checked in today
    const atRiskUsers = await this.prisma.userStreak.findMany({
      where: {
        currentStreak: { gt: 0 },
        OR: [
          { lastCheckInDate: { lt: today } },
          { lastCheckInDate: null },
        ],
      },
      include: {
        user: {
          include: { notificationPreference: true },
        },
      },
    });

    for (const streak of atRiskUsers) {
      if (!streak.user.notificationPreference?.streakReminders) continue;

      await this.scheduleNotification(streak.userId, {
        type: 'streak_reminder',
        title: 'Your streak is at risk!',
        body: `You have a ${streak.currentStreak}-day streak. Check in before midnight to keep it going!`,
        scheduledFor: new Date(),
      });
    }
  }

  // Analyze patterns and send insights (Monday 10 AM)
  @Cron('0 10 * * 1')
  async sendWeeklyInsights() {
    const proUsers = await this.prisma.user.findMany({
      where: { tier: 'PRO' },
      include: { notificationPreference: true },
    });

    for (const user of proUsers) {
      if (!user.notificationPreference?.insightAlerts) continue;

      const insight = await this.generatePatternInsight(user.id);
      if (insight) {
        await this.scheduleNotification(user.id, {
          type: 'insight',
          title: 'Weekly Pattern Insight',
          body: insight,
          scheduledFor: new Date(),
        });
      }
    }
  }

  private async generatePatternInsight(userId: string): Promise<string | null> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        biases: { not: null },
      },
    });

    if (conversations.length < 3) return null;

    // Find most common bias
    const biasCounts = new Map<string, number>();
    conversations.forEach(c => {
      ((c.biases as any[]) || []).forEach(b => {
        biasCounts.set(b.name, (biasCounts.get(b.name) || 0) + 1);
      });
    });

    const topBias = Array.from(biasCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (!topBias) return null;

    return `This week you showed "${topBias[0]}" thinking ${topBias[1]} times. Try the reframe exercise in your dashboard.`;
  }

  private async scheduleNotification(userId: string, data: {
    type: string;
    title: string;
    body: string;
    scheduledFor: Date;
  }) {
    return this.prisma.scheduledNotification.create({
      data: { userId, ...data },
    });
  }
}
```

**Commit:** `feat(notifications): add pattern-based smart push notifications`

---

# Integration Tasks

---

## Task: Update Dashboard with New Features

**File:** `apps/client/src/app/dashboard/page.tsx`

Add the following sections to the dashboard:

1. Import and add `<StreakCard />` component
2. Add "Your Exercises" section showing pending AI-generated exercises
3. Add "Export Your Data" section with `<ExportButton />`
4. Add "Mental Fitness Score" gauge (Pro only)
5. Add "Active Programs" section showing enrollment progress

---

## Task: Update Pricing Page

Highlight new features on the pricing page:

**Pro tier now includes:**
- Weekly PDF Profile Reports
- Mental Fitness Score tracking
- AI-generated personalized exercises
- Structured CBT programs
- Smart pattern notifications
- Data export (JSON/CSV)

---

## Task: Register New Modules

**File:** `apps/api/src/app.module.ts`

```typescript
import { StreaksModule } from './modules/streaks/streaks.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FitnessScoreModule } from './modules/fitness-score/fitness-score.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // ... existing
    StreaksModule,
    ExercisesModule,
    ReportsModule,
    FitnessScoreModule,
    ProgramsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
```

---

# Verification Checklist

After implementing each feature:

1. [ ] Run `npx prisma migrate dev` to apply schema changes
2. [ ] Run `npm run build` to verify TypeScript compiles
3. [ ] Test API endpoints with curl or Postman
4. [ ] Verify frontend components render correctly
5. [ ] Check Pro-only features are gated properly
6. [ ] Test on mobile viewport

---

# Next Steps

After completing this plan:

1. **A/B Test**: Roll out features to 50% of Pro users first
2. **Analytics**: Track feature usage via Mixpanel/Amplitude
3. **Pricing Test**: Consider $12 tier for streaks+exercises only
4. **Content Pipeline**: Create more CBT programs (Anxiety, Perfectionism)
5. **Community**: Add anonymous peer groups based on shared patterns

---

## Execution Options

1. **Subagent-Driven**: Execute tasks in current session with fresh subagent per task
2. **Parallel Session**: Use `/executing-plans` skill in separate session with checkpoints
