import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, AnalysisResult } from './ai.types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AnalysisData {
  emotionalState: {
    primary: string;
    secondary?: string;
    intensity: 'low' | 'moderate' | 'high';
    evidence?: string;
  };
  biases: Array<{
    name: string;
    confidence: number;
    description: string;
    evidence?: string;
  }>;
  patterns: Array<{
    name: string;
    percentage: number;
  }>;
  insights: string[];
}

export interface ChatWithAnalysisResponse extends ChatResponse {
  analysis: AnalysisData | null;
}

// Tiered model types
export type ModelTier = 'fast' | 'deep';

export interface GenerationParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface ThinkingConfig {
  enabled: boolean;
  budgetTokens?: number;
}

export interface ExtendedChatOptions {
  modelTier: ModelTier;
  thinking?: ThinkingConfig;
  generation?: GenerationParams;
}

export interface ModelTierContext {
  messageCount: number;
  isSessionEnd?: boolean;
  requiresDeepAnalysis?: boolean;
  hasComplexEmotionalContent?: boolean;
}

@Injectable()
export class OpenRouterProvider implements AIProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fastModel: string;
  private readonly deepModel: string;
  private readonly thinkingBudget: number;
  private readonly fastTemperature: number;
  private readonly deepTemperature: number;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('openrouter.apiKey') || '';
    this.model = this.configService.get<string>('openrouter.model') || 'openai/gpt-4o-mini';
    this.fastModel = this.configService.get<string>('openrouter.fastModel') || 'openai/gpt-4o-mini';
    this.deepModel = this.configService.get<string>('openrouter.deepModel') || 'anthropic/claude-sonnet-4';
    this.thinkingBudget = this.configService.get<number>('openrouter.thinkingBudget') || 10000;
    this.fastTemperature = this.configService.get<number>('openrouter.fastTemperature') || 0.7;
    this.deepTemperature = this.configService.get<number>('openrouter.deepTemperature') || 0.3;

    if (!this.apiKey) {
      this.logger.warn('OpenRouter API key not configured');
    }
  }

  /**
   * Get model based on tier
   */
  private getModelForTier(tier: ModelTier): string {
    return tier === 'deep' ? this.deepModel : this.fastModel;
  }

  /**
   * Get temperature based on tier
   */
  private getTemperatureForTier(tier: ModelTier): number {
    return tier === 'deep' ? this.deepTemperature : this.fastTemperature;
  }

  /**
   * Determine which model tier to use based on conversation context
   */
  determineModelTier(context: ModelTierContext): ModelTier {
    // Use deep model for:
    // - Final session analysis (session end)
    // - Explicit deep analysis request
    // - Complex emotional content that needs careful handling
    // - Every 5th message for periodic deeper analysis

    if (context.isSessionEnd || context.requiresDeepAnalysis) {
      return 'deep';
    }

    if (context.hasComplexEmotionalContent) {
      return 'deep';
    }

    // Periodic deep analysis every 5 messages (starting from message 5)
    if (context.messageCount > 0 && context.messageCount % 5 === 0) {
      return 'deep';
    }

    return 'fast';
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    this.logger.log(`Sending chat request to OpenRouter using model: ${this.model}`);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.configService.get<string>('frontendUrl') || 'http://localhost:3000',
        'X-Title': 'Matcha AI',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenRouter API error: ${error}`);
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      message: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  async streamChat(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
  ): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    this.logger.log(`Sending streaming chat request to OpenRouter using model: ${this.model}`);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.configService.get<string>('frontendUrl') || 'http://localhost:3000',
        'X-Title': 'Matcha AI',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenRouter API error: ${error}`);
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullMessage = '';
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullMessage += content;
            onChunk(content);
          }

          if (parsed.usage) {
            usage = {
              promptTokens: parsed.usage.prompt_tokens || 0,
              completionTokens: parsed.usage.completion_tokens || 0,
              totalTokens: parsed.usage.total_tokens || 0,
            };
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return {
      message: fullMessage,
      model: this.model,
      usage,
    };
  }

  /**
   * Chat with psychological analysis - returns both response and analysis
   */
  async chatWithAnalysis(messages: ChatMessage[]): Promise<ChatWithAnalysisResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    this.logger.log(`Sending chat+analysis request to OpenRouter using model: ${this.model}`);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.configService.get<string>('frontendUrl') || 'http://localhost:3000',
        'X-Title': 'Matcha AI',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenRouter API error: ${error}`);
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    let parsed: { reply?: string; analysis?: AnalysisData | null } = {};
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      this.logger.warn('Failed to parse JSON response, using raw content');
      parsed = { reply: content, analysis: null };
    }

    return {
      message: parsed.reply || content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      analysis: parsed.analysis || null,
    };
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Analyze text for cognitive biases, thinking patterns, and emotional state
   * Implements AIProvider interface for queue processor
   */
  async analyze(inputText: string): Promise<AnalysisResult> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    this.logger.log('Starting AI analysis...');

    const systemPrompt = `You are a cognitive psychology expert. Analyze the following text and return a JSON object with:
- biases: array of {name: string, intensity: number (0-100), description: string} - cognitive biases detected
- patterns: array of {name: string, percentage: number (0-100)} - thinking patterns, must sum to 100
- insights: array of strings - 3-4 actionable insights about the person's thinking
- emotionalState: {primary: string, secondary?: string, intensity: "low"|"moderate"|"high"}

Be thorough but concise. Return ONLY valid JSON.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.configService.get<string>('frontendUrl') || 'http://localhost:3000',
        'X-Title': 'Matcha AI Analysis',
      },
      body: JSON.stringify({
        model: this.fastModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputText },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenRouter API error: ${error}`);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(content);
      this.logger.log('AI analysis complete');
      return {
        biases: parsed.biases || [],
        patterns: parsed.patterns || [],
        insights: parsed.insights || [],
        emotionalState: parsed.emotionalState || { primary: 'neutral', intensity: 'low' },
      };
    } catch (e) {
      this.logger.error('Failed to parse analysis response');
      throw new Error('Failed to parse AI analysis response');
    }
  }

  /**
   * Chat with tiered model selection and optional extended thinking support
   */
  async chatWithThinking(
    messages: ChatMessage[],
    options: ExtendedChatOptions,
  ): Promise<ChatWithAnalysisResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const model = this.getModelForTier(options.modelTier);
    const temperature =
      options.generation?.temperature ?? this.getTemperatureForTier(options.modelTier);

    this.logger.log(
      `Sending chat request to OpenRouter using model: ${model} (tier: ${options.modelTier}, thinking: ${options.thinking?.enabled ?? false})`,
    );

    // Calculate tokens - when using extended thinking, max_tokens must be > reasoning budget
    const thinkingBudget = options.thinking?.budgetTokens || this.thinkingBudget;
    const useThinking = options.thinking?.enabled && model.includes('anthropic/claude');

    // If thinking enabled, max_tokens must be greater than thinking budget
    // Add 4096 for the actual response on top of thinking budget
    const maxTokens = useThinking
      ? thinkingBudget + 4096
      : (options.generation?.maxTokens || 4096);

    const requestBody: Record<string, unknown> = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    };

    // Add reasoning parameter for Claude models with extended thinking
    if (useThinking) {
      requestBody.reasoning = {
        max_tokens: thinkingBudget,
      };
      this.logger.log(
        `Extended thinking enabled with budget: ${thinkingBudget} tokens (total max: ${maxTokens})`,
      );
    }

    if (options.generation?.topP !== undefined) {
      requestBody.top_p = options.generation.topP;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          this.configService.get<string>('frontendUrl') || 'http://localhost:3000',
        'X-Title': 'Matcha AI',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenRouter API error: ${error}`);
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    let parsed: { reply?: string; analysis?: AnalysisData | null } = {};
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      this.logger.warn('Failed to parse JSON response, using raw content');
      parsed = { reply: content, analysis: null };
    }

    return {
      message: parsed.reply || content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      analysis: parsed.analysis || null,
    };
  }
}
