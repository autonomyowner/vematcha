import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PlansModule } from './modules/plans/plans.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ChatModule } from './modules/chat/chat.module';
import { TtsModule } from './modules/tts/tts.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { VoiceModule } from './modules/voice/voice.module';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Global rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 60, // 60 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AnalysesModule,
    DashboardModule,
    PlansModule,
    WebhooksModule,
    ChatModule,
    TtsModule,
    VoiceModule,
    StripeModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
