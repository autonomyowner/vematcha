/**
 * Session Analysis Prompts
 * For deep end-of-session analysis with extended thinking
 */

import { getBiasNames } from './cognitive-bias-framework';

export interface SessionData {
  messages: Array<{ role: string; content: string }>;
  accumulatedBiases?: Array<{ name: string; confidence: number }>;
  emotionalJourney?: Array<{ emotion: string; intensity: string }>;
}

export function getSessionAnalysisPrompt(sessionData: SessionData): string {
  const messageTranscript = sessionData.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const biasesContext = sessionData.accumulatedBiases?.length
    ? `Previously detected biases: ${JSON.stringify(sessionData.accumulatedBiases)}`
    : 'No biases previously detected';

  const emotionalContext = sessionData.emotionalJourney?.length
    ? `Emotional journey: ${JSON.stringify(sessionData.emotionalJourney)}`
    : 'No emotional journey data';

  // Get validated bias names from unified framework
  const validBiasNames = getBiasNames().join(', ');

  return `You are Matcha, conducting a thoughtful end-of-session analysis.

Your role is to synthesize the conversation and provide meaningful insights that help this person understand themselves better.

REVIEW THE CONVERSATION:
---
${messageTranscript}
---

PREVIOUSLY DETECTED:
${biasesContext}
${emotionalContext}

YOUR TASK:
Conduct a comprehensive analysis of this conversation session. Think deeply about:

1. CORE THEMES: What were the main topics and underlying concerns?
2. EMOTIONAL ARC: How did their emotional state evolve through the conversation?
3. COGNITIVE PATTERNS: What thinking patterns emerged consistently?
4. PROGRESS: What shifts in perspective or realizations occurred?
5. GROWTH EDGES: What areas might benefit from continued exploration?

ANALYSIS APPROACH:
- Look for patterns across messages, not just individual statements
- Notice what they said AND what they might have been avoiding
- Consider the relationship between thoughts, feelings, and behaviors
- Identify strengths and resources they demonstrated
- Be specific - avoid generic observations

PROVIDE YOUR ANALYSIS IN THIS JSON FORMAT:
{
  "sessionSummary": {
    "mainThemes": ["theme1", "theme2", "theme3"],
    "emotionalArc": "Description of how emotions evolved through the session",
    "keyInsights": [
      "Specific insight about their thinking pattern",
      "Observation about their emotional responses",
      "Noticed strength or resource they demonstrated"
    ],
    "progressMade": "What shifts or realizations occurred during this session",
    "growthEdges": [
      "Area that might benefit from continued exploration",
      "Pattern worth noticing going forward"
    ]
  },
  "refinedAnalysis": {
    "confirmedBiases": [
      {
        "name": "Bias name",
        "confidence": 0.7-1.0,
        "pattern": "How this showed up across the conversation"
      }
    ],
    "dominantPatterns": [
      {"name": "Analytical", "percentage": 0-100},
      {"name": "Emotional", "percentage": 0-100},
      {"name": "Pragmatic", "percentage": 0-100},
      {"name": "Creative", "percentage": 0-100}
    ],
    "emotionalBaseline": {
      "primary": "Most common emotional state",
      "variability": "low" | "moderate" | "high"
    }
  },
  "closingMessage": "A warm, encouraging message to close the session that acknowledges what they shared and celebrates any progress"
}

VALID BIAS NAMES (use only these):
${validBiasNames}

IMPORTANT:
- Only include biases that showed up multiple times or very clearly
- Use ONLY the validated bias names listed above
- Pay special attention to Procrastination (emotional avoidance) and Catastrophizing (what-if chains)
- Patterns must sum to 100%
- The closing message should feel personal and warm, not generic
- If the conversation was brief or light, adjust analysis depth accordingly`;
}
