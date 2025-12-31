import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AnalysisResult, CognitiveBias, ThinkingPattern } from './ai.types';

// Aligned with cognitive-bias-framework.ts - the 11 validated CBT biases
const COGNITIVE_BIASES: Omit<CognitiveBias, 'intensity'>[] = [
  {
    name: 'All-or-Nothing Thinking',
    description: 'Viewing situations in only two categories (black-and-white) rather than on a continuum.',
  },
  {
    name: 'Catastrophizing',
    description: "Expecting the worst possible outcome; 'what if' spirals that escalate into cascading predictions of disaster.",
  },
  {
    name: 'Mind Reading',
    description: "Assuming you know what others are thinking without evidence.",
  },
  {
    name: 'Should Statements',
    description: "Rigid expectations using 'should', 'must', 'have to' that create unnecessary pressure.",
  },
  {
    name: 'Emotional Reasoning',
    description: 'Treating feelings as evidence about reality.',
  },
  {
    name: 'Overgeneralization',
    description: 'Drawing broad conclusions from single events.',
  },
  {
    name: 'Personalization',
    description: 'Taking excessive blame for things outside your control.',
  },
  {
    name: 'Filtering',
    description: 'Focusing only on negatives while ignoring or dismissing positives.',
  },
  {
    name: 'Fortune Telling',
    description: 'Predicting negative outcomes with false certainty.',
  },
  {
    name: 'Labeling',
    description: 'Defining self or others with global negative labels rather than specific behaviors.',
  },
  {
    name: 'Procrastination',
    description: 'A complex self-regulatory failure involving avoidance of tasks due to emotional dysregulation, perfectionism, or fear of failure.',
  },
];

const THINKING_PATTERNS: string[] = [
  'Analytical',
  'Creative',
  'Pragmatic',
  'Emotional',
  'Intuitive',
  'Logical',
];

const INSIGHTS_TEMPLATES: string[] = [
  'You tend to approach problems with a {pattern} mindset, which helps you {benefit}.',
  'Your thought patterns suggest a tendency toward {bias}, consider exploring alternative perspectives.',
  'When facing uncertainty, you often rely on {pattern} thinking.',
  'Your emotional responses indicate {emotion} as a primary driver in decision-making.',
  'Consider balancing your {pattern} approach with more {alternative} thinking.',
  'You show strength in {pattern} reasoning, which serves you well in complex situations.',
  'Be mindful of {bias} when evaluating new information.',
  'Your natural inclination toward {pattern} thinking can be both a strength and limitation.',
];

const EMOTIONS = [
  'contemplative',
  'anxious',
  'hopeful',
  'frustrated',
  'curious',
  'determined',
  'overwhelmed',
  'confident',
  'uncertain',
  'reflective',
];

@Injectable()
export class MockAIProvider implements AIProvider {
  private readonly logger = new Logger(MockAIProvider.name);

  async analyze(inputText: string): Promise<AnalysisResult> {
    this.logger.log('Starting mock analysis...');

    // Simulate processing time (1-3 seconds)
    await this.delay(1000 + Math.random() * 2000);

    // Generate deterministic but varied results based on input
    const seed = this.hashString(inputText);

    const biases = this.generateBiases(seed);
    const patterns = this.generatePatterns(seed);
    const insights = this.generateInsights(seed, biases, patterns);
    const emotionalState = this.generateEmotionalState(seed);

    this.logger.log('Mock analysis complete');

    return {
      biases,
      patterns,
      insights,
      emotionalState,
    };
  }

  private generateBiases(seed: number): CognitiveBias[] {
    const count = 2 + (seed % 3); // 2-4 biases
    const shuffled = this.shuffleWithSeed([...COGNITIVE_BIASES], seed);

    return shuffled.slice(0, count).map((bias, index) => ({
      ...bias,
      intensity: 30 + ((seed * (index + 1)) % 50), // 30-80%
    }));
  }

  private generatePatterns(seed: number): ThinkingPattern[] {
    const shuffled = this.shuffleWithSeed([...THINKING_PATTERNS], seed);
    let remaining = 100;

    return shuffled.slice(0, 4).map((name, index) => {
      const isLast = index === 3;
      const percentage = isLast
        ? remaining
        : Math.min(remaining - (3 - index) * 5, 15 + ((seed * (index + 1)) % 35));
      remaining -= percentage;

      return { name, percentage };
    }).sort((a, b) => b.percentage - a.percentage);
  }

  private generateInsights(
    seed: number,
    biases: CognitiveBias[],
    patterns: ThinkingPattern[],
  ): string[] {
    const count = 3 + (seed % 2); // 3-4 insights
    const insights: string[] = [];

    const topPattern = patterns[0].name.toLowerCase();
    const topBias = biases[0].name.toLowerCase();
    const altPattern = patterns[patterns.length - 1].name.toLowerCase();

    const templates = this.shuffleWithSeed([...INSIGHTS_TEMPLATES], seed);

    for (let i = 0; i < count; i++) {
      let insight = templates[i];
      insight = insight.replace('{pattern}', topPattern);
      insight = insight.replace('{bias}', topBias);
      insight = insight.replace('{alternative}', altPattern);
      insight = insight.replace('{emotion}', EMOTIONS[seed % EMOTIONS.length]);
      insight = insight.replace('{benefit}', 'see patterns others might miss');
      insights.push(insight);
    }

    return insights;
  }

  private generateEmotionalState(seed: number) {
    const intensities: ('low' | 'moderate' | 'high')[] = ['low', 'moderate', 'high'];

    return {
      primary: EMOTIONS[seed % EMOTIONS.length],
      secondary: EMOTIONS[(seed + 3) % EMOTIONS.length],
      intensity: intensities[seed % 3],
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private shuffleWithSeed<T>(array: T[], seed: number): T[] {
    const result = [...array];
    let currentSeed = seed;

    for (let i = result.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      const j = currentSeed % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
