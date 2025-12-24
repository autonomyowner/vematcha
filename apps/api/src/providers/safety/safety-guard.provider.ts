/**
 * Safety Guardrail Provider
 *
 * Multi-layered safety system for mental health AI:
 * 1. Regex-based crisis pattern detection (fast, local)
 * 2. AI-powered content moderation (OpenRouter Llama Guard)
 * 3. Response safety validation before sending to user
 *
 * Critical for preventing:
 * - Self-harm encouragement
 * - Inappropriate therapeutic advice
 * - Missing crisis interventions
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// @ts-ignore - AxiosInstance type issue
import type { AxiosInstance } from 'axios';

export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRISIS = 'crisis',
}

export interface SafetyCheckResult {
  isSafe: boolean;
  riskLevel: RiskLevel;
  flags: string[]; // Specific safety concerns detected
  requiresIntervention: boolean; // Should redirect to crisis resources
  recommendations: string[]; // What to do
}

export interface CrisisIndicators {
  suicidalIdeation: boolean;
  selfHarm: boolean;
  homicidalThoughts: boolean;
  substanceAbuse: boolean;
  psychosis: boolean;
  severeDistress: boolean;
}

@Injectable()
export class SafetyGuardProvider {
  private readonly logger = new Logger(SafetyGuardProvider.name);
  private readonly openRouterClient: AxiosInstance;
  private readonly openRouterKey: string;

  // Emergency resources
  private readonly CRISIS_RESOURCES = {
    'suicide-lifeline': '988',
    'crisis-text-line': 'Text HELLO to 741741',
    'emergency': '911',
    'national-domestic-violence': '1-800-799-7233',
  };

  constructor(private config: ConfigService) {
    this.openRouterKey = this.config.get<string>('openrouter.apiKey') || '';

    this.openRouterClient = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // Safety checks should be fast
    });
  }

  /**
   * Primary safety check for user input
   * Runs BEFORE processing by main LLM
   */
  async checkUserInput(content: string, context?: {
    userId: string;
    previousMessages?: Array<{ role: string; content: string }>;
  }): Promise<SafetyCheckResult> {
    // Layer 1: Fast regex-based crisis detection
    const regexCheck = this.regexCrisisDetection(content);

    if (regexCheck.riskLevel === RiskLevel.CRISIS) {
      // Critical: Immediate crisis detected, skip AI check
      return regexCheck;
    }

    // Layer 2: AI-powered safety analysis (for nuanced detection)
    try {
      const aiCheck = await this.aiSafetyCheck(content, 'user-input');

      // Combine both checks (take higher risk level)
      const combinedRiskLevel = this.combineRiskLevels(
        regexCheck.riskLevel,
        aiCheck.riskLevel,
      );

      return {
        isSafe: aiCheck.isSafe && regexCheck.isSafe,
        riskLevel: combinedRiskLevel,
        flags: [...new Set([...regexCheck.flags, ...aiCheck.flags])],
        requiresIntervention:
          regexCheck.requiresIntervention || aiCheck.requiresIntervention,
        recommendations: [
          ...new Set([...regexCheck.recommendations, ...aiCheck.recommendations]),
        ],
      };
    } catch (error) {
      this.logger.warn(`AI safety check failed, falling back to regex: ${error.message}`);
      // Fallback to regex check if AI fails
      return regexCheck;
    }
  }

  /**
   * Safety check for AI-generated responses
   * Runs AFTER LLM generates response, BEFORE sending to user
   *
   * Prevents AI from:
   * - Providing harmful advice
   * - Encouraging self-harm
   * - Missing crisis indicators
   * - Being overly directive
   */
  async checkAIResponse(
    response: string,
    userMessage: string,
  ): Promise<SafetyCheckResult> {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let riskLevel = RiskLevel.NONE;
    let requiresIntervention = false;

    // Check 1: Response should not encourage harmful behavior
    const harmfulPatterns = [
      /\b(you should|try to|it's okay to).*(end|kill|hurt).*(yourself|your life)\b/i,
      /\b(suicide|self.?harm).*(is a (good|valid|reasonable) (option|choice))\b/i,
      /\bhere's how to\b.*\b(overdose|cut|hang)\b/i,
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(response)) {
        flags.push('HARMFUL_ADVICE');
        riskLevel = RiskLevel.CRISIS;
        requiresIntervention = true;
        recommendations.push('BLOCK_RESPONSE: AI generated harmful content');
        break;
      }
    }

    // Check 2: If user message indicates crisis, AI must redirect to resources
    const userCrisisCheck = this.regexCrisisDetection(userMessage);
    if (
      userCrisisCheck.riskLevel === RiskLevel.CRISIS &&
      !this.containsCrisisResources(response)
    ) {
      flags.push('MISSING_CRISIS_INTERVENTION');
      riskLevel = RiskLevel.HIGH;
      recommendations.push(
        'ADD_CRISIS_RESOURCES: User in crisis but AI did not provide emergency resources',
      );
    }

    // Check 3: Response should not be overly directive/prescriptive
    const directivePatterns = [
      /\byou (must|need to|have to|should definitely)\b/gi,
      /\b(definitely|absolutely|certainly) (do|try|stop|start)\b/gi,
    ];

    let directiveCount = 0;
    for (const pattern of directivePatterns) {
      const matches = response.match(pattern);
      if (matches) directiveCount += matches.length;
    }

    if (directiveCount > 3) {
      flags.push('OVERLY_DIRECTIVE');
      recommendations.push(
        'SOFTEN_LANGUAGE: Response is too prescriptive, should be more collaborative',
      );
    }

    const isSafe = !flags.includes('HARMFUL_ADVICE') && !flags.includes('MISSING_CRISIS_INTERVENTION');

    return {
      isSafe,
      riskLevel,
      flags,
      requiresIntervention,
      recommendations,
    };
  }

  /**
   * Fast regex-based crisis detection
   * Used as first line of defense
   */
  private regexCrisisDetection(content: string): SafetyCheckResult {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let riskLevel = RiskLevel.NONE;

    const indicators: CrisisIndicators = {
      suicidalIdeation: false,
      selfHarm: false,
      homicidalThoughts: false,
      substanceAbuse: false,
      psychosis: false,
      severeDistress: false,
    };

    // Tier 1: CRISIS - Immediate danger
    const suicidePatterns = [
      /\b(going to|planning to|want to|gonna).{0,30}(kill myself|end my life|commit suicide)\b/i,
      /\b(have|got|bought).{0,20}(gun|pills|rope|weapon).{0,30}(to|for).{0,20}(kill|end|die)\b/i,
      /\b(tonight|today|right now|this morning).{0,30}(kill myself|end it|die|suicide)\b/i,
      /\bi('m| am) (done|finished) (with|living|life)\b/i,
      /\bno (point|reason) (in|to) (living|go on|continue)\b/i,
      /\beveryone.{0,20}better off.{0,20}without me\b/i,
      /\bgoodbye.{0,30}(forever|for good|won't see|last time)\b/i,
    ];

    const selfHarmPatterns = [
      /\b(cutting|burning|hitting) myself\b/i,
      /\bwant to hurt myself\b/i,
      /\b(started|going to start|about to).{0,20}(cutting|self.harm)\b/i,
    ];

    const homicidalPatterns = [
      /\b(going to|planning to|want to).{0,30}(hurt|kill|murder).{0,30}(someone|people|them|him|her)\b/i,
      /\b(have|got).{0,20}(gun|weapon).{0,30}(for|to use on)\b/i,
    ];

    for (const pattern of suicidePatterns) {
      if (pattern.test(content)) {
        indicators.suicidalIdeation = true;
        flags.push('SUICIDAL_IDEATION_WITH_INTENT');
        riskLevel = RiskLevel.CRISIS;
        break;
      }
    }

    for (const pattern of selfHarmPatterns) {
      if (pattern.test(content)) {
        indicators.selfHarm = true;
        flags.push('SELF_HARM_INTENT');
        if (riskLevel !== RiskLevel.CRISIS) {
          riskLevel = RiskLevel.HIGH;
        }
      }
    }

    for (const pattern of homicidalPatterns) {
      if (pattern.test(content)) {
        indicators.homicidalThoughts = true;
        flags.push('HOMICIDAL_IDEATION');
        riskLevel = RiskLevel.CRISIS;
      }
    }

    // Tier 2: HIGH - Passive ideation, severe distress
    const passiveSuicidePatterns = [
      /\b(wish i (was|were) dead|don't want to (be alive|live)|want to (die|disappear))\b/i,
      /\b(thinking about|thoughts of) (suicide|killing myself|ending it)\b/i,
      /\blife (isn't|is not) worth living\b/i,
    ];

    const severeDistressPatterns = [
      /\b(can't take it|cannot go on|falling apart|breaking down) anymore\b/i,
      /\b(completely|totally) (hopeless|worthless|alone)\b/i,
      /\bnothing (will ever|can) (change|get better|help)\b/i,
    ];

    if (riskLevel !== RiskLevel.CRISIS) {
      for (const pattern of passiveSuicidePatterns) {
        if (pattern.test(content)) {
          indicators.suicidalIdeation = true;
          flags.push('PASSIVE_SUICIDAL_IDEATION');
          riskLevel = RiskLevel.HIGH;
          break;
        }
      }

      for (const pattern of severeDistressPatterns) {
        if (pattern.test(content)) {
          indicators.severeDistress = true;
          flags.push('SEVERE_DISTRESS');
          if (riskLevel === RiskLevel.NONE) {
            riskLevel = RiskLevel.HIGH;
          }
        }
      }
    }

    // Determine intervention needed
    const requiresIntervention =
      riskLevel === RiskLevel.CRISIS || riskLevel === RiskLevel.HIGH;

    if (requiresIntervention) {
      recommendations.push('PROVIDE_CRISIS_RESOURCES');
      recommendations.push('PRIORITIZE_SAFETY_VALIDATION');
      if (riskLevel === RiskLevel.CRISIS) {
        recommendations.push('IMMEDIATE_REDIRECT_TO_988');
      }
    }

    // TypeScript narrowing is confused here - riskLevel can be any value at this point
    const safe = [RiskLevel.NONE, RiskLevel.LOW, RiskLevel.MODERATE].includes(riskLevel as any);

    return {
      isSafe: safe,
      riskLevel,
      flags,
      requiresIntervention,
      recommendations,
    };
  }

  /**
   * AI-powered safety check using Llama Guard via OpenRouter
   */
  private async aiSafetyCheck(
    content: string,
    type: 'user-input' | 'ai-response',
  ): Promise<SafetyCheckResult> {
    try {
      // Use Llama Guard 2 for content moderation
      const response = await this.openRouterClient.post('/chat/completions', {
        model: 'meta-llama/llama-guard-2-8b', // Llama Guard 2 for safety
        messages: [
          {
            role: 'system',
            content: `You are a mental health safety classifier. Analyze the following ${type} for crisis indicators.

Classify into one of these risk levels:
- NONE: No safety concerns
- LOW: Mild distress, no immediate risk
- MODERATE: Moderate distress, monitor closely
- HIGH: Passive suicidal ideation, self-harm thoughts, severe distress
- CRISIS: Active suicidal ideation with plan/intent, immediate danger

Respond in JSON format:
{
  "riskLevel": "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRISIS",
  "flags": ["list of specific concerns"],
  "reasoning": "brief explanation"
}`,
          },
          {
            role: 'user',
            content: content,
          },
        ],
        temperature: 0.1, // Low temp for consistent classification
        max_tokens: 200,
      });

      const aiOutput = response.data.choices[0].message.content;

      // Parse JSON response
      const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI safety check returned invalid JSON');
      }

      const result = JSON.parse(jsonMatch[0]);
      const riskLevel = result.riskLevel as RiskLevel;

      return {
        isSafe: riskLevel === RiskLevel.NONE || riskLevel === RiskLevel.LOW,
        riskLevel,
        flags: result.flags || [],
        requiresIntervention: riskLevel === RiskLevel.CRISIS || riskLevel === RiskLevel.HIGH,
        recommendations:
          riskLevel === RiskLevel.CRISIS || riskLevel === RiskLevel.HIGH
            ? ['PROVIDE_CRISIS_RESOURCES']
            : [],
      };
    } catch (error) {
      this.logger.error(`AI safety check failed: ${error.message}`);
      // Fail open with LOW risk (regex check will catch critical issues)
      return {
        isSafe: true,
        riskLevel: RiskLevel.LOW,
        flags: ['AI_CHECK_FAILED'],
        requiresIntervention: false,
        recommendations: [],
      };
    }
  }

  /**
   * Check if response contains crisis resources
   */
  private containsCrisisResources(response: string): boolean {
    const resourceIndicators = [
      /\b988\b/, // Suicide & Crisis Lifeline
      /\b741.?741\b/, // Crisis Text Line
      /\b911\b/, // Emergency
      /\b(suicide|crisis).{0,20}(lifeline|hotline|line)\b/i,
      /\bcall.{0,30}(help|support|crisis)\b/i,
      /\btext.{0,20}(HELLO|HOME|CRISIS)\b/i,
    ];

    return resourceIndicators.some((pattern) => pattern.test(response));
  }

  /**
   * Combine two risk levels, taking the higher one
   */
  private combineRiskLevels(level1: RiskLevel, level2: RiskLevel): RiskLevel {
    const hierarchy = [
      RiskLevel.NONE,
      RiskLevel.LOW,
      RiskLevel.MODERATE,
      RiskLevel.HIGH,
      RiskLevel.CRISIS,
    ];

    const index1 = hierarchy.indexOf(level1);
    const index2 = hierarchy.indexOf(level2);

    return hierarchy[Math.max(index1, index2)];
  }

  /**
   * Generate crisis intervention message
   */
  getCrisisInterventionMessage(flags: string[]): string {
    const hasActiveSuicideIntent = flags.some((f) =>
      f.includes('SUICIDAL_IDEATION_WITH_INTENT'),
    );
    const hasPassiveSuicide = flags.some((f) =>
      f.includes('PASSIVE_SUICIDAL_IDEATION'),
    );

    if (hasActiveSuicideIntent) {
      return `I can hear how much pain you're in right now. That level of pain is real, and I want you to be safe.

🚨 **Please reach out for immediate support:**
• **Call 988** (Suicide & Crisis Lifeline) - 24/7, free, confidential
• **Text "HELLO" to 741741** (Crisis Text Line)
• **Call 911** if you're in immediate danger

These are trained professionals who can help in moments like this. Will you reach out to them right now?

I'm an AI and I can't provide the emergency support you need, but these people can. You're not alone in this.`;
    }

    if (hasPassiveSuicide) {
      return `I hear how hard things are right now. Those kinds of thoughts are a sign of deep pain, and I want you to know there's support available.

**Please consider reaching out:**
• **988 Suicide & Crisis Lifeline** (call or text)
• **Crisis Text Line**: Text "HELLO" to 741741

These services are free, confidential, and available 24/7. Talking to someone can help.

Have you talked to anyone about these feelings?`;
    }

    return `It sounds like you're going through something really difficult. I'm here to listen and support you. If things feel overwhelming, please remember:

• **988 Suicide & Crisis Lifeline** (24/7)
• **Crisis Text Line**: Text "HELLO" to 741741

Let's talk about what's going on. What's the hardest part right now?`;
  }

  /**
   * Get crisis resources formatted for display
   */
  getCrisisResources(): Record<string, string> {
    return this.CRISIS_RESOURCES;
  }
}
