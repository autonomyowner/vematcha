/**
 * Unified Cognitive Bias Detection Framework
 * Single source of truth for all bias definitions used across chat and voice sessions
 *
 * Based on evidence-based CBT research (Beck, Burns) and 2024-2025 clinical literature:
 * - Catastrophizing: Blueprint.ai, Positive Psychology, PMC research
 * - Procrastination: British Journal of Psychology 2025, Taylor & Francis 2025
 */

export interface TherapeuticIntervention {
  technique: string;
  description: string;
  socraticQuestions: string[];
}

export interface CognitiveBiasDefinition {
  name: string;
  description: string;
  detectionSignals: string[];
  examplePhrases: string[];
  evidenceRequired: string;
  therapeuticInterventions: TherapeuticIntervention[];
  category: 'distortion' | 'avoidance' | 'rumination';
}

export const COGNITIVE_BIASES: CognitiveBiasDefinition[] = [
  // ===== 1. ALL-OR-NOTHING THINKING =====
  {
    name: 'All-or-Nothing Thinking',
    description:
      'Viewing situations in only two categories (black-and-white) rather than on a continuum',
    detectionSignals: [
      "Absolute words: 'always', 'never', 'completely', 'totally', 'perfect', 'ruined'",
      'Binary framing of outcomes or situations',
      'No middle ground acknowledged',
    ],
    examplePhrases: [
      'I always mess things up',
      'Nothing ever works out for me',
      "If it's not perfect, it's a failure",
      'I totally failed',
    ],
    evidenceRequired: 'Specific words or phrases showing binary/absolute thinking',
    therapeuticInterventions: [
      {
        technique: 'Continuum Thinking',
        description: 'Help identify shades of gray between extremes',
        socraticQuestions: [
          'On a scale of 0-100, where would this actually fall?',
          "What would be a 'partial success' in this situation?",
          "Can you think of a time when something was 'mostly' good even if not perfect?",
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 2. CATASTROPHIZING (ENHANCED - 2024-2025 Research) =====
  {
    name: 'Catastrophizing',
    description:
      "Expecting the worst possible outcome; 'what if' spirals that escalate into cascading predictions of disaster. Often masked as 'being realistic' or 'being prepared'.",
    detectionSignals: [
      "'What if' CHAINS - one fear leading to another in sequence (key indicator)",
      'Cascading predictions: If X happens, then Y will happen, then Z... (doom spiral)',
      'Magnification of negative outcomes with certainty language',
      'Worst-case scenario presented as most likely or inevitable',
      'Physical/emotional reactions disproportionate to the actual situation',
      "Often MASKED as 'being realistic', 'being prepared', or 'just thinking ahead'",
      'Fortune-telling that develops into escalating cycles',
      'Rumination loops - same catastrophic thought repeating',
    ],
    examplePhrases: [
      "What if I fail? Then I'll lose my job, then I won't pay rent, then...",
      'If this goes wrong, everything will fall apart',
      'This is going to be a complete disaster',
      "I'll never recover from this",
      'What if it gets worse? And then what if...',
      'I need to think about all the ways this could go wrong',
      "I'm just being realistic about how bad this could get",
    ],
    evidenceRequired:
      "Escalation pattern from specific event to catastrophic outcome; 'what if' chains; worst-case presented as certainty",
    therapeuticInterventions: [
      {
        technique: 'Decatastrophizing',
        description: 'Challenge the probability and survivability of feared outcomes',
        socraticQuestions: [
          "What's the actual evidence this worst case will happen?",
          'On a scale of 1-10, how likely is this really?',
          'If it did happen, what would you actually do?',
          "What's happened in similar situations before?",
        ],
      },
      {
        technique: 'Breaking the What-If Chain',
        description: 'Interrupt cascading fear spirals at the first link',
        socraticQuestions: [
          "Let's pause at the first 'what if' - what's the evidence for that one?",
          'Each step in this chain - how likely is each transition?',
          'What are some alternative outcomes at each step?',
        ],
      },
      {
        technique: 'Cost-Benefit Analysis',
        description: 'Examine the usefulness of catastrophic thinking',
        socraticQuestions: [
          'How is thinking about the worst case helping you right now?',
          "What's the cost of spending energy on this worry?",
          'Would you advise a friend to think this way?',
        ],
      },
      {
        technique: 'Reality Testing',
        description: 'Ground predictions in observable evidence',
        socraticQuestions: [
          'What facts do we actually have vs. what are we predicting?',
          'How many times has your worst-case prediction actually come true?',
          "What would a neutral observer say about this situation?",
        ],
      },
    ],
    category: 'rumination',
  },

  // ===== 3. MIND READING =====
  {
    name: 'Mind Reading',
    description: "Assuming you know what others are thinking without evidence",
    detectionSignals: [
      "Claiming knowledge of others' thoughts or judgments",
      'Projecting negative evaluations onto others',
      "'They probably think...', 'I know they're judging me'",
    ],
    examplePhrases: [
      "They definitely think I'm incompetent",
      'Everyone could tell I was nervous',
      "She thinks I'm annoying",
      "They're probably talking about me",
    ],
    evidenceRequired: "Claim about others' internal states without verification",
    therapeuticInterventions: [
      {
        technique: 'Evidence Examination',
        description: 'Distinguish assumptions from facts',
        socraticQuestions: [
          "What evidence do you have for what they're thinking?",
          'Have you ever been wrong about what someone was thinking?',
          'What are three other things they might actually be thinking?',
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 4. SHOULD STATEMENTS =====
  {
    name: 'Should Statements',
    description:
      "Rigid expectations using 'should', 'must', 'have to' that create unnecessary pressure",
    detectionSignals: [
      "'Should', 'must', 'have to', 'ought to' directed at self or others",
      "Inflexible rules about how things 'should' be",
      'Guilt or frustration when rules are violated',
    ],
    examplePhrases: [
      'I should be able to handle this by now',
      'I must not make mistakes',
      'I have to be perfect',
      'I ought to know better',
    ],
    evidenceRequired: 'Prescriptive self-talk creating pressure or guilt',
    therapeuticInterventions: [
      {
        technique: 'Preference Reframing',
        description: 'Convert demands into preferences',
        socraticQuestions: [
          "What if we changed 'I should' to 'I would prefer to'?",
          'Where does this rule come from? Is it helpful?',
          'What would you say to someone else with this expectation?',
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 5. EMOTIONAL REASONING =====
  {
    name: 'Emotional Reasoning',
    description: 'Treating feelings as evidence about reality',
    detectionSignals: [
      'Feelings presented as proof of facts',
      "'I feel X, therefore X is true'",
      'Emotions used to validate conclusions',
    ],
    examplePhrases: [
      'I feel stupid, so I must be stupid',
      'I feel like a failure, so I am one',
      'I feel overwhelmed, so this must be impossible',
    ],
    evidenceRequired: 'Feeling stated as evidence for conclusion about reality',
    therapeuticInterventions: [
      {
        technique: 'Feeling vs. Fact Distinction',
        description: 'Separate emotional experience from factual conclusions',
        socraticQuestions: [
          'Does feeling this way make it true?',
          'Can you be competent and still feel incompetent?',
          'What facts exist separate from how you feel?',
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 6. OVERGENERALIZATION =====
  {
    name: 'Overgeneralization',
    description: 'Drawing broad conclusions from single events',
    detectionSignals: [
      'Single instance generalized to pattern',
      "'This always happens', 'I never...', 'Everyone...'",
      'One failure = permanent pattern',
    ],
    examplePhrases: [
      "I failed once, so I'll fail again",
      'This always happens to me',
      'I never get things right',
    ],
    evidenceRequired: 'One instance being generalized to universal rule',
    therapeuticInterventions: [
      {
        technique: 'Exception Finding',
        description: 'Identify counterexamples to the generalization',
        socraticQuestions: [
          "Can you think of a time when this didn't happen?",
          "Is this truly 'always' or has there been even one exception?",
          'What would you need to see to update this conclusion?',
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 7. PERSONALIZATION =====
  {
    name: 'Personalization',
    description: 'Taking excessive blame for things outside your control',
    detectionSignals: [
      'Self-blame for external events',
      "Assuming responsibility for others' emotions or outcomes",
      "'It's my fault that...'",
    ],
    examplePhrases: [
      "It's my fault they're in a bad mood",
      'The project failed because of me',
      'If I had done something different...',
    ],
    evidenceRequired: 'Self-blame for external events outside personal control',
    therapeuticInterventions: [
      {
        technique: 'Responsibility Pie',
        description: 'Distribute responsibility accurately among all factors',
        socraticQuestions: [
          'What percentage of this was actually in your control?',
          'What other factors contributed to this outcome?',
          'If a friend did exactly what you did, would you blame them?',
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 8. FILTERING =====
  {
    name: 'Filtering',
    description: 'Focusing only on negatives while ignoring or dismissing positives',
    detectionSignals: [
      'Dismissing compliments or positive feedback',
      'Focusing on one criticism amid many positives',
      "'That doesn't count', 'Anyone could do that'",
    ],
    examplePhrases: [
      'Sure, but that one thing went wrong',
      "The compliment doesn't count because...",
      "They're just being nice",
    ],
    evidenceRequired: 'Positive dismissed or minimized while negative amplified',
    therapeuticInterventions: [
      {
        technique: 'Positive Data Log',
        description: 'Actively collect and record positive evidence',
        socraticQuestions: [
          'What positive things are you filtering out right now?',
          'If you gave equal weight to the positives, what would change?',
          'Why does the negative count but not the positive?',
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 9. FORTUNE TELLING =====
  {
    name: 'Fortune Telling',
    description: 'Predicting negative outcomes with false certainty',
    detectionSignals: [
      'Negative predictions stated as facts',
      'Certainty about future without evidence',
      "'I know it won't work', 'This will definitely fail'",
    ],
    examplePhrases: [
      "I know this won't work out",
      "There's no point trying, it'll fail",
      'I can already tell this will be a disaster',
    ],
    evidenceRequired: 'Negative prediction stated as certain fact',
    therapeuticInterventions: [
      {
        technique: 'Prediction Testing',
        description: 'Examine evidence for and against the prediction',
        socraticQuestions: [
          'What\'s your evidence that this will definitely happen?',
          'Have your predictions like this been accurate in the past?',
          'What would need to happen for a different outcome?',
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 10. LABELING =====
  {
    name: 'Labeling',
    description:
      'Defining self or others with global negative labels rather than specific behaviors',
    detectionSignals: [
      'Identity-level judgments vs behavior-level',
      "'I am a...' vs 'I did...'",
      'Global character conclusions from specific actions',
    ],
    examplePhrases: ["I'm such a failure", "I'm an idiot", "He's a jerk", "I'm worthless"],
    evidenceRequired: 'Identity-level negative label rather than behavior description',
    therapeuticInterventions: [
      {
        technique: 'Behavior vs. Identity Separation',
        description: 'Distinguish actions from core identity',
        socraticQuestions: [
          'Does one action define who you are as a person?',
          'Would you label a friend this way for the same thing?',
          'What would be a more accurate, specific description?',
        ],
      },
    ],
    category: 'distortion',
  },

  // ===== 11. PROCRASTINATION (NEW - 2024-2025 Research) =====
  {
    name: 'Procrastination',
    description:
      'A complex self-regulatory failure involving avoidance of tasks due to emotional dysregulation, low self-efficacy, perfectionism, or fear of failure. Research shows this is NOT simply poor time management but an emotional coping mechanism.',
    detectionSignals: [
      // Avoidance language
      "Avoidance language: 'I'll do it later', 'not ready yet', 'don't know where to start'",
      'Repeatedly putting off important tasks despite knowing negative consequences',
      // Rationalization patterns
      "Rationalization: 'I work better under pressure', 'need to feel inspired first', 'waiting for the right moment'",
      // Fear of failure indicators
      "Fear of failure: 'What if I fail?', 'not good enough yet', 'need more preparation'",
      // Perfectionism connection
      "Perfectionism: 'It has to be perfect', 'can't start until conditions are right'",
      'All-or-nothing approach to starting tasks',
      // Task aversiveness
      "Task aversiveness: 'I hate doing this', 'it's so boring', 'dreading this'",
      // Time-based guilt/anxiety
      "Time-based anxiety: 'I've wasted so much time', 'I should have started sooner'",
      // Self-handicapping
      'Creating obstacles or excuses to protect self-esteem if task fails',
    ],
    examplePhrases: [
      "I'll start tomorrow when I'm more focused",
      'I need to be in the right headspace',
      'I work better under pressure anyway',
      "What if I put in all this effort and it's still not good enough?",
      "I can't start until I know exactly how to do it perfectly",
      "I've been meaning to do this for weeks but...",
      "I just can't bring myself to start",
      "I keep putting it off even though I know I shouldn't",
    ],
    evidenceRequired:
      'Pattern of avoidance with emotional component (fear, perfectionism, overwhelm) - not just scheduling issues',
    therapeuticInterventions: [
      {
        technique: 'Emotional Excavation',
        description: 'Identify the underlying emotion driving avoidance',
        socraticQuestions: [
          'When you think about starting this task, what feeling comes up?',
          "What's the worst that could happen if you tried and it wasn't perfect?",
          'Is there something about this task that feels threatening?',
        ],
      },
      {
        technique: 'Task Decomposition',
        description: 'Break overwhelming tasks into tiny, non-threatening steps',
        socraticQuestions: [
          "What's the absolute smallest first step you could take?",
          'What would 5 minutes of progress look like?',
          'Can we break this down until it feels less overwhelming?',
        ],
      },
      {
        technique: 'Perfectionism Challenging',
        description: "Address the 'perfect or nothing' mindset",
        socraticQuestions: [
          "What would 'good enough' look like for this task?",
          'Does everything you do need to be perfect?',
          "What's the cost of waiting for perfect conditions?",
        ],
      },
      {
        technique: 'Self-Compassion Intervention',
        description: 'Replace self-criticism with understanding',
        socraticQuestions: [
          'What would you say to a friend struggling with this same task?',
          'Is beating yourself up helping you start?',
          'Can you acknowledge this is hard without judging yourself?',
        ],
      },
      {
        technique: 'Fear Cycle Interruption',
        description: 'Break the fear -> avoidance -> more fear loop',
        socraticQuestions: [
          'Has avoiding this made you feel better or worse over time?',
          'What happens to the fear if you take one small action?',
          'What would doing just 10% of this task feel like?',
        ],
      },
    ],
    category: 'avoidance',
  },
];

/**
 * Generate the detection framework as a string for prompt injection
 */
export function getCognitiveBiasDetectionPrompt(): string {
  let prompt = `COGNITIVE BIAS DETECTION FRAMEWORK:

IMPORTANT: Only report biases you're highly confident about (>0.7 confidence).
Always provide specific evidence from their message.

HIGH-CONFIDENCE BIASES TO DETECT:

`;

  COGNITIVE_BIASES.forEach((bias, index) => {
    prompt += `${index + 1}. ${bias.name}
   - Description: ${bias.description}
   - Detection Signals: ${bias.detectionSignals.join('; ')}
   - Examples: "${bias.examplePhrases.slice(0, 3).join('", "')}"
   - Evidence Required: ${bias.evidenceRequired}

`;
  });

  prompt += `DETECTION RULES:
- Only report biases with specific, quotable evidence
- Never report more than 3 biases per message
- If uncertain, don't report it
- Consider context: some "biases" are actually realistic assessments
- Patterns matter more than single instances
- For Procrastination: Look for EMOTIONAL avoidance (fear, perfectionism, overwhelm), not just scheduling issues
- For Catastrophizing: Look for "what if" CHAINS and cascading predictions, not just single worries
- Note when catastrophizing is masked as "being realistic" or "being prepared"`;

  return prompt;
}

/**
 * Get therapeutic interventions for a specific bias
 */
export function getInterventionsForBias(biasName: string): TherapeuticIntervention[] | null {
  const bias = COGNITIVE_BIASES.find(
    (b) => b.name.toLowerCase() === biasName.toLowerCase(),
  );
  return bias?.therapeuticInterventions || null;
}

/**
 * Get a suggested Socratic question for a specific bias
 */
export function getSuggestedQuestion(biasName: string): string | null {
  const interventions = getInterventionsForBias(biasName);
  if (!interventions || interventions.length === 0) return null;

  // Return the first Socratic question from the first intervention
  return interventions[0].socraticQuestions[0] || null;
}

/**
 * Get list of all bias names for validation
 */
export function getBiasNames(): string[] {
  return COGNITIVE_BIASES.map((b) => b.name);
}

/**
 * Get bias definition by name
 */
export function getBiasDefinition(biasName: string): CognitiveBiasDefinition | null {
  return (
    COGNITIVE_BIASES.find((b) => b.name.toLowerCase() === biasName.toLowerCase()) || null
  );
}
