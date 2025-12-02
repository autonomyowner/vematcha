import { Module } from '@nestjs/common';
import { MockAIProvider } from './mock-ai.provider';
import { OpenRouterProvider } from './openrouter.provider';

// AI_PROVIDER token for dependency injection
export const AI_PROVIDER = 'AI_PROVIDER';

@Module({
  providers: [
    MockAIProvider,
    OpenRouterProvider,
    {
      provide: AI_PROVIDER,
      useExisting: MockAIProvider,
    },
  ],
  exports: [AI_PROVIDER, MockAIProvider, OpenRouterProvider],
})
export class AIModule {}
