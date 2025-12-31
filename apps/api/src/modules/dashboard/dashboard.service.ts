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
   * Export user data in JSON, CSV, or printable HTML format
   */
  async exportUserData(
    userId: string,
    format: 'json' | 'csv' | 'print',
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

    if (format === 'print') {
      return this.convertToPrintableHTML(exportData);
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

  private convertToPrintableHTML(data: any): string {
    const generateInsightsList = (insights: string[]) => {
      if (!insights || insights.length === 0) return '<p class="empty">No insights recorded</p>';
      return `<ul>${insights.map(i => `<li>${i}</li>`).join('')}</ul>`;
    };

    const generateBiasesList = (biases: string[]) => {
      if (!biases || biases.length === 0) return '<span class="empty">None detected</span>';
      return biases.map(b => `<span class="tag">${b}</span>`).join(' ');
    };

    const generatePatternsList = (patterns: string[]) => {
      if (!patterns || patterns.length === 0) return '<span class="empty">None identified</span>';
      return patterns.map(p => `<span class="tag pattern">${p}</span>`).join(' ');
    };

    // Collect all unique insights
    const allInsights = new Set<string>();
    data.chatSessions.forEach((s: any) => s.keyInsights.forEach((i: string) => allInsights.add(i)));
    data.textAnalyses.forEach((a: any) => a.keyInsights.forEach((i: string) => allInsights.add(i)));

    // Collect all biases with counts
    const biasCount = new Map<string, number>();
    data.chatSessions.forEach((s: any) => {
      s.biasesDetected.forEach((b: string) => {
        const name = b.split(' (')[0];
        biasCount.set(name, (biasCount.get(name) || 0) + 1);
      });
    });
    data.textAnalyses.forEach((a: any) => {
      a.biasesDetected.forEach((b: string) => {
        const name = b.split(' (')[0];
        biasCount.set(name, (biasCount.get(name) || 0) + 1);
      });
    });

    const topBiases = Array.from(biasCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Matcha Insights Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 20mm;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: #2d2d2d;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #4a7c59;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #4a7c59;
      letter-spacing: -1px;
    }

    .logo span {
      color: #7fb069;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .report-info {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      font-size: 13px;
      color: #555;
    }

    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #4a7c59;
      border-bottom: 2px solid #e8e8e8;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .summary-card {
      background: #f8faf8;
      border: 1px solid #e0e8e0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .summary-number {
      font-size: 28px;
      font-weight: 700;
      color: #4a7c59;
    }

    .summary-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tag {
      display: inline-block;
      background: #f0f5f0;
      border: 1px solid #d0e0d0;
      color: #4a7c59;
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 12px;
      margin: 2px;
    }

    .tag.pattern {
      background: #f5f5f0;
      border-color: #e0e0d0;
      color: #666;
    }

    .session-card, .analysis-card {
      background: #fafafa;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .session-title {
      font-weight: 600;
      color: #333;
    }

    .session-date {
      font-size: 12px;
      color: #888;
    }

    .session-meta {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }

    .field-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
      margin-top: 12px;
      margin-bottom: 4px;
    }

    .empty {
      color: #aaa;
      font-style: italic;
      font-size: 13px;
    }

    .insights-list {
      background: #f8faf8;
      border-left: 4px solid #4a7c59;
      padding: 16px 20px;
      margin-top: 8px;
    }

    .insights-list ul {
      padding-left: 20px;
    }

    .insights-list li {
      margin-bottom: 8px;
      color: #444;
    }

    .bias-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .bias-item {
      background: #fff;
      border: 1px solid #d0e0d0;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      min-width: 120px;
    }

    .bias-name {
      font-size: 13px;
      font-weight: 500;
      color: #4a7c59;
    }

    .bias-count {
      font-size: 11px;
      color: #888;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 12px;
      color: #888;
    }

    @media print {
      body { padding: 0; }
      .session-card, .analysis-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">matcha<span>.xyz</span></div>
    <div class="subtitle">Personal Insights Report</div>
    <div class="report-info">
      <span>Prepared for: ${data.userProfile.name}</span>
      <span>Generated: ${data.exportInfo.exportedAtReadable}</span>
    </div>
    <div class="report-info">
      <span>Period: ${data.exportInfo.periodFrom} to ${data.exportInfo.periodTo}</span>
      <span>Member since: ${data.userProfile.memberSince}</span>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-number">${data.summary.totalChatSessions}</div>
        <div class="summary-label">Chat Sessions</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${data.summary.totalTextAnalyses}</div>
        <div class="summary-label">Text Analyses</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${data.summary.totalInteractions}</div>
        <div class="summary-label">Total Interactions</div>
      </div>
    </div>
  </div>

  ${topBiases.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Most Common Cognitive Biases</h2>
    <div class="bias-summary">
      ${topBiases.map(([name, count]) => `
        <div class="bias-item">
          <div class="bias-name">${name}</div>
          <div class="bias-count">Detected ${count} time${count > 1 ? 's' : ''}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">Key Insights</h2>
    <div class="insights-list">
      ${allInsights.size > 0
        ? `<ul>${Array.from(allInsights).map(i => `<li>${i}</li>`).join('')}</ul>`
        : '<p class="empty">No insights recorded yet. Keep using Matcha to build your profile.</p>'
      }
    </div>
  </div>

  ${data.chatSessions.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Chat Sessions</h2>
    ${data.chatSessions.map((session: any) => `
      <div class="session-card">
        <div class="session-header">
          <span class="session-title">${session.title}</span>
          <span class="session-date">${session.date}</span>
        </div>
        <div class="session-meta">${session.messageCount} messages${session.emotionalState ? ` • ${session.emotionalState}` : ''}</div>
        <div class="field-label">Biases Detected</div>
        <div>${generateBiasesList(session.biasesDetected)}</div>
        <div class="field-label">Thinking Patterns</div>
        <div>${generatePatternsList(session.thinkingPatterns)}</div>
        ${session.keyInsights.length > 0 ? `
          <div class="field-label">Insights</div>
          ${generateInsightsList(session.keyInsights)}
        ` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.textAnalyses.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Text Analyses</h2>
    ${data.textAnalyses.map((analysis: any) => `
      <div class="analysis-card">
        <div class="session-header">
          <span class="session-title">Analysis</span>
          <span class="session-date">${analysis.date}</span>
        </div>
        <div class="session-meta" style="font-style: italic; color: #666;">"${analysis.textAnalyzed}"</div>
        <div class="field-label">Biases Detected</div>
        <div>${generateBiasesList(analysis.biasesDetected)}</div>
        <div class="field-label">Thinking Patterns</div>
        <div>${generatePatternsList(analysis.thinkingPatterns)}</div>
        ${analysis.keyInsights.length > 0 ? `
          <div class="field-label">Insights</div>
          ${generateInsightsList(analysis.keyInsights)}
        ` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by matcha.xyz — Your personal cognitive bias companion</p>
    <p style="margin-top: 4px;">This report is confidential and intended for personal use only.</p>
  </div>
</body>
</html>`;
  }
}
