import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MockAIProvider } from './mock-ai.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { AIProvider } from './ai.types';

// AI_PROVIDER token for dependency injection
export const AI_PROVIDER = 'AI_PROVIDER';

const logger = new Logger('AIModule');

@Module({
  imports: [ConfigModule],
  providers: [
    MockAIProvider,
    OpenRouterProvider,
    {
      provide: AI_PROVIDER,
      useFactory: (
        configService: ConfigService,
        openRouter: OpenRouterProvider,
        mock: MockAIProvider,
      ): AIProvider => {
        const apiKey = configService.get<string>('OPENROUTER_API_KEY');
        if (apiKey) {
          logger.log('Using OpenRouterProvider for AI');
          return openRouter;
        }
        logger.warn('OPENROUTER_API_KEY not set - using MockAIProvider');
        return mock;
      },
      inject: [ConfigService, OpenRouterProvider, MockAIProvider],
    },
  ],
  exports: [AI_PROVIDER, MockAIProvider, OpenRouterProvider],
})
export class AIModule {}
