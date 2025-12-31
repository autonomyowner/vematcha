export interface CognitiveBias {
  name: string;
  intensity: number; // 0-100 (or confidence 0-1)
  description: string;
  evidence?: string; // Specific quote from user message
  suggestedIntervention?: string; // CBT technique or Socratic question
}

export interface ThinkingPattern {
  name: string;
  percentage: number; // 0-100
}

export interface EmotionalState {
  primary: string;
  secondary?: string;
  intensity: 'low' | 'moderate' | 'high';
}

export interface AnalysisResult {
  biases: CognitiveBias[];
  patterns: ThinkingPattern[];
  insights: string[];
  emotionalState: EmotionalState;
}

export interface AIProvider {
  analyze(inputText: string): Promise<AnalysisResult>;
}
