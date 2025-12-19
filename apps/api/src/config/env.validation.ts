import { z } from 'zod';

export const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('4000').transform(Number),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Clerk
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // Stripe Payments (optional - payments disabled if not set)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_YEARLY_PRICE_ID: z.string().optional(),

  // OpenRouter AI - Tiered Models
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4o-mini'), // Legacy - kept for backward compatibility
  OPENROUTER_FAST_MODEL: z.string().default('openai/gpt-4o-mini'),
  OPENROUTER_DEEP_MODEL: z.string().default('anthropic/claude-sonnet-4'),
  OPENROUTER_THINKING_BUDGET: z.string().default('10000').transform(Number),
  OPENROUTER_FAST_TEMPERATURE: z.string().default('0.7').transform(Number),
  OPENROUTER_DEEP_TEMPERATURE: z.string().default('0.3').transform(Number),

  // Vapi.ai Voice Infrastructure
  VAPI_API_KEY: z.string().optional(),
  VAPI_PUBLIC_KEY: z.string().optional(),

  // ElevenLabs Text-to-Speech
  ELEVENLABS_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
