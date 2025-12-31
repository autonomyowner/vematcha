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
   * Export user data as a beautiful printable PDF-style report
   */
  async exportUserData(
    userId: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const to = toDate ? new Date(toDate) : new Date();

    const [conversations, analyses, user] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId, createdAt: { gte: from, lte: to } },
        include: { messages: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.analysis.findMany({
        where: { userId, createdAt: { gte: from, lte: to }, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, email: true, createdAt: true },
      }),
    ]);

    // Collect all biases with counts
    const biasCount = new Map<string, number>();
    const collectBias = (biases: any) => {
      if (!biases || !Array.isArray(biases)) return;
      biases.forEach((b: any) => {
        biasCount.set(b.name, (biasCount.get(b.name) || 0) + 1);
      });
    };
    conversations.forEach(c => collectBias(c.biases));
    analyses.forEach(a => collectBias(a.biases));
    const topBiases = Array.from(biasCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Collect all insights
    const allInsights: string[] = [];
    conversations.forEach(c => {
      if (c.insights && Array.isArray(c.insights)) {
        (c.insights as string[]).forEach(i => { if (!allInsights.includes(i)) allInsights.push(i); });
      }
    });
    analyses.forEach(a => {
      if (a.insights && Array.isArray(a.insights)) {
        (a.insights as string[]).forEach(i => { if (!allInsights.includes(i)) allInsights.push(i); });
      }
    });

    const userName = user?.firstName || 'User';
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const periodStart = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const periodEnd = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Matcha Insights Report - ${userName}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #f5f7f5 0%, #e8f0e8 100%);
      min-height: 100vh;
      color: #2c3e2c;
      line-height: 1.6;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
      box-shadow: 0 0 40px rgba(0,0,0,0.1);
    }

    .header {
      background: linear-gradient(135deg, #4a7c59 0%, #5d9a6e 100%);
      color: white;
      padding: 48px 40px;
      text-align: center;
    }

    .logo {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -2px;
      margin-bottom: 8px;
    }

    .logo .dot { color: #a8d5a2; }

    .tagline {
      font-size: 15px;
      opacity: 0.9;
      font-weight: 300;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .meta-bar {
      background: #3d6b4a;
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      color: rgba(255,255,255,0.9);
      font-size: 13px;
    }

    .content { padding: 40px; }

    .greeting {
      font-size: 24px;
      color: #4a7c59;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .period {
      color: #666;
      font-size: 14px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e8f0e8;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f8fbf8 0%, #f0f5f0 100%);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      border: 1px solid #e0e8e0;
    }

    .stat-number {
      font-size: 40px;
      font-weight: 700;
      color: #4a7c59;
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 8px;
    }

    .section {
      margin-bottom: 36px;
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      gap: 12px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #4a7c59;
    }

    .section-line {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, #4a7c59 0%, transparent 100%);
    }

    .bias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .bias-card {
      background: white;
      border: 2px solid #e8f0e8;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      transition: all 0.2s;
    }

    .bias-card:hover { border-color: #4a7c59; transform: translateY(-2px); }

    .bias-name {
      font-weight: 600;
      color: #4a7c59;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .bias-count {
      font-size: 11px;
      color: #888;
    }

    .insights-box {
      background: linear-gradient(135deg, #f8fbf8 0%, #f0f5f0 100%);
      border-radius: 16px;
      padding: 24px;
      border-left: 4px solid #4a7c59;
    }

    .insight-item {
      padding: 12px 0;
      border-bottom: 1px solid #e0e8e0;
      color: #444;
      font-size: 15px;
    }

    .insight-item:last-child { border-bottom: none; }

    .insight-number {
      display: inline-block;
      width: 24px;
      height: 24px;
      background: #4a7c59;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #888;
      font-style: italic;
    }

    .footer {
      background: #f8fbf8;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e8f0e8;
    }

    .footer-text {
      color: #888;
      font-size: 12px;
    }

    .footer-brand {
      color: #4a7c59;
      font-weight: 600;
    }

    @media print {
      body { background: white; }
      .page { box-shadow: none; }
      .bias-card:hover { transform: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">matcha<span class="dot">.</span>xyz</div>
      <div class="tagline">Personal Insights Report</div>
    </div>

    <div class="meta-bar">
      <span>Prepared for ${userName}</span>
      <span>${reportDate}</span>
    </div>

    <div class="content">
      <div class="greeting">Your Cognitive Profile</div>
      <div class="period">Analysis period: ${periodStart} - ${periodEnd}</div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${conversations.length}</div>
          <div class="stat-label">Chat Sessions</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${analyses.length}</div>
          <div class="stat-label">Text Analyses</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${conversations.length + analyses.length}</div>
          <div class="stat-label">Total Insights</div>
        </div>
      </div>

      ${topBiases.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <span class="section-title">Your Top Cognitive Biases</span>
          <span class="section-line"></span>
        </div>
        <div class="bias-grid">
          ${topBiases.map(([name, count]) => `
            <div class="bias-card">
              <div class="bias-name">${name}</div>
              <div class="bias-count">Detected ${count}x</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-header">
          <span class="section-title">Key Insights About You</span>
          <span class="section-line"></span>
        </div>
        ${allInsights.length > 0 ? `
        <div class="insights-box">
          ${allInsights.slice(0, 8).map((insight, i) => `
            <div class="insight-item">
              <span class="insight-number">${i + 1}</span>
              ${insight}
            </div>
          `).join('')}
        </div>
        ` : `
        <div class="empty-state">
          No insights yet. Keep using Matcha to discover patterns in your thinking.
        </div>
        `}
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">
        Generated by <span class="footer-brand">matcha.xyz</span> — Your personal cognitive companion
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}
