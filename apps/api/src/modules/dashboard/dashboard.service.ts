import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BiasStats {
  name: string;
  avgIntensity: number;
  count: number;
}

export interface PatternStats {
  name: string;
  avgPercentage: number;
}

export interface EmotionalTrend {
  emotion: string;
  count: number;
  avgIntensity: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    // Fetch user with analyses, usage limits, and conversations
    const [user, conversations] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          usageLimit: true,
          analyses: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.conversation.findMany({
        where: {
          userId,
          analysisUpdatedAt: { not: null },
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          emotionalState: true,
          biases: true,
          patterns: true,
          insights: true,
          analysisUpdatedAt: true,
          updatedAt: true,
        },
      }),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const completedAnalyses = user.analyses;
    const totalAnalyses = completedAnalyses.length;
    const totalConversationsWithAnalysis = conversations.length;

    // Calculate usage
    let analysesThisMonth = 0;
    let chatMessagesThisMonth = 0;
    if (user.usageLimit) {
      if (new Date(user.usageLimit.monthResetAt) > now) {
        analysesThisMonth = user.usageLimit.analysesThisMonth;
        chatMessagesThisMonth = user.usageLimit.chatMessagesThisMonth;
      }
    }

    const analysesRemaining =
      user.tier === 'PRO' ? null : Math.max(0, 3 - analysesThisMonth);
    const chatMessagesRemaining =
      user.tier === 'PRO' ? null : Math.max(0, 50 - chatMessagesThisMonth);

    // Get last analysis date (from either analyses or conversations)
    const lastAnalysis = completedAnalyses[0];
    const lastConversation = conversations[0];
    const lastAnalysisDate = lastAnalysis?.createdAt.toISOString() || null;
    const lastChatAnalysisDate = lastConversation?.analysisUpdatedAt?.toISOString() || null;

    // Calculate profile completion (based on number of analyses + conversations)
    const totalInteractions = totalAnalyses + totalConversationsWithAnalysis;
    const completionPercentage = Math.min(100, Math.round((totalInteractions / 15) * 100));

    // Aggregate bias statistics from both sources
    const biasStats = this.aggregateBiasesFromAll(completedAnalyses, conversations);

    // Aggregate pattern statistics from both sources
    const patternStats = this.aggregatePatternsFromAll(completedAnalyses, conversations);

    // Get recent insights from both sources
    const recentInsights = this.getRecentInsightsFromAll(completedAnalyses.slice(0, 5), conversations.slice(0, 5));

    // Aggregate emotional trends from chat conversations
    const emotionalTrends = this.aggregateEmotionalTrends(conversations);

    return {
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        tier: user.tier,
        memberSince: user.createdAt.toISOString(),
        completionPercentage,
      },
      usage: {
        analysesThisMonth,
        analysesRemaining,
        chatMessagesThisMonth,
        chatMessagesRemaining,
        totalAnalyses,
        totalConversationsWithAnalysis,
        lastAnalysisDate,
        lastChatAnalysisDate,
      },
      stats: {
        topBiases: biasStats.slice(0, 4),
        patterns: patternStats,
        emotionalTrends: emotionalTrends.slice(0, 5),
      },
      recentInsights,
    };
  }

  private aggregateBiases(analyses: any[]): BiasStats[] {
    const biasMap = new Map<string, { total: number; count: number }>();

    for (const analysis of analyses) {
      if (!analysis.biases) continue;

      const biases = analysis.biases as Array<{ name: string; intensity: number }>;
      for (const bias of biases) {
        const existing = biasMap.get(bias.name) || { total: 0, count: 0 };
        existing.total += bias.intensity;
        existing.count += 1;
        biasMap.set(bias.name, existing);
      }
    }

    return Array.from(biasMap.entries())
      .map(([name, { total, count }]) => ({
        name,
        avgIntensity: Math.round(total / count),
        count,
      }))
      .sort((a, b) => b.avgIntensity - a.avgIntensity);
  }

  private aggregatePatterns(analyses: any[]): PatternStats[] {
    const patternMap = new Map<string, { total: number; count: number }>();

    for (const analysis of analyses) {
      if (!analysis.patterns) continue;

      const patterns = analysis.patterns as Array<{ name: string; percentage: number }>;
      for (const pattern of patterns) {
        const existing = patternMap.get(pattern.name) || { total: 0, count: 0 };
        existing.total += pattern.percentage;
        existing.count += 1;
        patternMap.set(pattern.name, existing);
      }
    }

    return Array.from(patternMap.entries())
      .map(([name, { total, count }]) => ({
        name,
        avgPercentage: Math.round(total / count),
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage)
      .slice(0, 4);
  }

  private getRecentInsights(analyses: any[]): string[] {
    const insights: string[] = [];

    for (const analysis of analyses) {
      if (!analysis.insights) continue;

      const analysisInsights = analysis.insights as string[];
      for (const insight of analysisInsights) {
        if (!insights.includes(insight)) {
          insights.push(insight);
        }
        if (insights.length >= 5) break;
      }
      if (insights.length >= 5) break;
    }

    return insights;
  }

  /**
   * Aggregate biases from both analyses and chat conversations
   */
  private aggregateBiasesFromAll(analyses: any[], conversations: any[]): BiasStats[] {
    const biasMap = new Map<string, { total: number; count: number }>();

    // From regular analyses (uses intensity)
    for (const analysis of analyses) {
      if (!analysis.biases) continue;
      const biases = analysis.biases as Array<{ name: string; intensity: number }>;
      for (const bias of biases) {
        const existing = biasMap.get(bias.name) || { total: 0, count: 0 };
        existing.total += bias.intensity;
        existing.count += 1;
        biasMap.set(bias.name, existing);
      }
    }

    // From chat conversations (uses confidence, scaled to 0-100)
    for (const conv of conversations) {
      if (!conv.biases) continue;
      const biases = conv.biases as Array<{ name: string; confidence: number; description: string }>;
      for (const bias of biases) {
        const existing = biasMap.get(bias.name) || { total: 0, count: 0 };
        existing.total += bias.confidence * 100; // Scale confidence to 0-100
        existing.count += 1;
        biasMap.set(bias.name, existing);
      }
    }

    return Array.from(biasMap.entries())
      .map(([name, { total, count }]) => ({
        name,
        avgIntensity: Math.round(total / count),
        count,
      }))
      .sort((a, b) => b.avgIntensity - a.avgIntensity);
  }

  /**
   * Aggregate patterns from both analyses and chat conversations
   */
  private aggregatePatternsFromAll(analyses: any[], conversations: any[]): PatternStats[] {
    const patternMap = new Map<string, { total: number; count: number }>();

    // From regular analyses
    for (const analysis of analyses) {
      if (!analysis.patterns) continue;
      const patterns = analysis.patterns as Array<{ name: string; percentage: number }>;
      for (const pattern of patterns) {
        const existing = patternMap.get(pattern.name) || { total: 0, count: 0 };
        existing.total += pattern.percentage;
        existing.count += 1;
        patternMap.set(pattern.name, existing);
      }
    }

    // From chat conversations
    for (const conv of conversations) {
      if (!conv.patterns) continue;
      const patterns = conv.patterns as Array<{ name: string; percentage: number }>;
      for (const pattern of patterns) {
        const existing = patternMap.get(pattern.name) || { total: 0, count: 0 };
        existing.total += pattern.percentage;
        existing.count += 1;
        patternMap.set(pattern.name, existing);
      }
    }

    return Array.from(patternMap.entries())
      .map(([name, { total, count }]) => ({
        name,
        avgPercentage: Math.round(total / count),
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage)
      .slice(0, 4);
  }

  /**
   * Get recent insights from both analyses and chat conversations
   */
  private getRecentInsightsFromAll(analyses: any[], conversations: any[]): string[] {
    const insights: string[] = [];

    // Combine and sort by date
    const allSources = [
      ...analyses.map(a => ({ insights: a.insights, date: a.createdAt })),
      ...conversations.map(c => ({ insights: c.insights, date: c.analysisUpdatedAt })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const source of allSources) {
      if (!source.insights) continue;
      const sourceInsights = source.insights as string[];
      for (const insight of sourceInsights) {
        if (!insights.includes(insight)) {
          insights.push(insight);
        }
        if (insights.length >= 5) break;
      }
      if (insights.length >= 5) break;
    }

    return insights;
  }

  /**
   * Aggregate emotional trends from chat conversations
   */
  private aggregateEmotionalTrends(conversations: any[]): EmotionalTrend[] {
    const emotionMap = new Map<string, { count: number; intensityTotal: number }>();

    const intensityValues: Record<string, number> = {
      low: 1,
      moderate: 2,
      high: 3,
    };

    for (const conv of conversations) {
      if (!conv.emotionalState) continue;
      const state = conv.emotionalState as { primary: string; secondary?: string; intensity: string };

      // Track primary emotion
      if (state.primary) {
        const existing = emotionMap.get(state.primary) || { count: 0, intensityTotal: 0 };
        existing.count += 1;
        existing.intensityTotal += intensityValues[state.intensity] || 2;
        emotionMap.set(state.primary, existing);
      }

      // Track secondary emotion if present
      if (state.secondary) {
        const existing = emotionMap.get(state.secondary) || { count: 0, intensityTotal: 0 };
        existing.count += 1;
        existing.intensityTotal += intensityValues[state.intensity] || 2;
        emotionMap.set(state.secondary, existing);
      }
    }

    return Array.from(emotionMap.entries())
      .map(([emotion, { count, intensityTotal }]) => ({
        emotion,
        count,
        avgIntensity: Math.round((intensityTotal / count) * 33.33), // Scale to 0-100
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Export user data in JSON or CSV format
   */
  async exportUserData(
    userId: string,
    format: 'json' | 'csv',
    fromDate?: string,
    toDate?: string,
  ) {
    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = toDate ? new Date(toDate) : new Date();

    const [conversations, analyses, user] = await Promise.all([
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
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, email: true, createdAt: true },
      }),
    ]);

    // Format biases for readability
    const formatBiases = (biases: any): string[] => {
      if (!biases || !Array.isArray(biases)) return [];
      return biases.map((b: any) => {
        const intensity = b.intensity ?? Math.round((b.confidence ?? 0) * 100);
        return `${b.name} (${intensity}%)`;
      });
    };

    // Format patterns for readability
    const formatPatterns = (patterns: any): string[] => {
      if (!patterns) return [];
      if (Array.isArray(patterns)) {
        return patterns.map((p: any) => `${p.name} (${p.percentage}%)`);
      }
      return [];
    };

    // Format emotional state
    const formatEmotionalState = (state: any): string => {
      if (!state) return '';
      const parts = [state.primary];
      if (state.secondary) parts.push(state.secondary);
      if (state.intensity) parts.push(`intensity: ${state.intensity}`);
      return parts.join(', ');
    };

    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedAtReadable: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        periodFrom: from.toISOString().split('T')[0],
        periodTo: to.toISOString().split('T')[0],
      },
      userProfile: {
        name: user?.firstName || 'User',
        email: user?.email || '',
        memberSince: user?.createdAt?.toISOString().split('T')[0] || '',
      },
      summary: {
        totalChatSessions: conversations.length,
        totalTextAnalyses: analyses.length,
        totalInteractions: conversations.length + analyses.length,
      },
      chatSessions: conversations.map(c => ({
        id: c.id,
        date: c.createdAt.toISOString().split('T')[0],
        title: c.title || 'Untitled Session',
        messageCount: c.messages.length,
        emotionalState: formatEmotionalState(c.emotionalState),
        biasesDetected: formatBiases(c.biases),
        thinkingPatterns: formatPatterns(c.patterns),
        keyInsights: c.insights || [],
      })),
      textAnalyses: analyses.map(a => ({
        id: a.id,
        date: a.createdAt.toISOString().split('T')[0],
        textAnalyzed: a.inputText.length > 200 ? a.inputText.substring(0, 200) + '...' : a.inputText,
        biasesDetected: formatBiases(a.biases),
        thinkingPatterns: formatPatterns(a.patterns),
        keyInsights: a.insights || [],
      })),
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return exportData;
  }

  private convertToCSV(data: any): string {
    const lines: string[] = [];

    // Header section
    lines.push('MATCHA INSIGHTS EXPORT');
    lines.push(`Exported: ${data.exportInfo.exportedAtReadable}`);
    lines.push(`Period: ${data.exportInfo.periodFrom} to ${data.exportInfo.periodTo}`);
    lines.push('');

    // Summary section
    lines.push('SUMMARY');
    lines.push(`Total Chat Sessions: ${data.summary.totalChatSessions}`);
    lines.push(`Total Text Analyses: ${data.summary.totalTextAnalyses}`);
    lines.push('');

    // Chat Sessions section
    if (data.chatSessions.length > 0) {
      lines.push('CHAT SESSIONS');
      lines.push('Date,Title,Messages,Emotional State,Biases Detected,Thinking Patterns,Key Insights');

      data.chatSessions.forEach((session: any) => {
        const row = [
          session.date,
          session.title,
          session.messageCount.toString(),
          session.emotionalState,
          session.biasesDetected.join('; ') || 'None detected',
          session.thinkingPatterns.join('; ') || 'None identified',
          session.keyInsights.join('; ') || 'No insights',
        ];
        lines.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      });
      lines.push('');
    }

    // Text Analyses section
    if (data.textAnalyses.length > 0) {
      lines.push('TEXT ANALYSES');
      lines.push('Date,Text Analyzed,Biases Detected,Thinking Patterns,Key Insights');

      data.textAnalyses.forEach((analysis: any) => {
        const row = [
          analysis.date,
          analysis.textAnalyzed,
          analysis.biasesDetected.join('; ') || 'None detected',
          analysis.thinkingPatterns.join('; ') || 'None identified',
          analysis.keyInsights.join('; ') || 'No insights',
        ];
        lines.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      });
      lines.push('');
    }

    // Aggregate insights section
    lines.push('ALL UNIQUE INSIGHTS');
    const allInsights = new Set<string>();
    data.chatSessions.forEach((s: any) => s.keyInsights.forEach((i: string) => allInsights.add(i)));
    data.textAnalyses.forEach((a: any) => a.keyInsights.forEach((i: string) => allInsights.add(i)));

    if (allInsights.size > 0) {
      let insightNum = 1;
      allInsights.forEach(insight => {
        lines.push(`${insightNum}. ${insight}`);
        insightNum++;
      });
    } else {
      lines.push('No insights recorded yet.');
    }

    return lines.join('\n');
  }
}
