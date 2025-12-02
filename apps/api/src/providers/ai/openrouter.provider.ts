import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class OpenRouterProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('openrouter.apiKey') || '';
    this.model = this.configService.get<string>('openrouter.model') || 'openai/gpt-4o-mini';

    if (!this.apiKey) {
      this.logger.warn('OpenRouter API key not configured');
    }
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

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
