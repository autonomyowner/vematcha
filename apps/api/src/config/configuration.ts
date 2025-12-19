import { validateEnv } from './env.validation';

export default () => {
  const env = validateEnv();

  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    frontendUrl: env.FRONTEND_URL,

    database: {
      url: env.DATABASE_URL,
    },

    redis: {
      url: env.REDIS_URL,
    },

    clerk: {
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
      webhookSecret: env.CLERK_WEBHOOK_SECRET,
    },

    r2: {
      accountId: env.R2_ACCOUNT_ID,
      endpoint: env.R2_ENDPOINT,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
    },

    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      monthlyPriceId: env.STRIPE_MONTHLY_PRICE_ID,
      yearlyPriceId: env.STRIPE_YEARLY_PRICE_ID,
    },

    openrouter: {
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL, // Legacy - kept for backward compatibility
      fastModel: env.OPENROUTER_FAST_MODEL,
      deepModel: env.OPENROUTER_DEEP_MODEL,
      thinkingBudget: env.OPENROUTER_THINKING_BUDGET,
      fastTemperature: env.OPENROUTER_FAST_TEMPERATURE,
      deepTemperature: env.OPENROUTER_DEEP_TEMPERATURE,
    },

    vapi: {
      apiKey: env.VAPI_API_KEY,
      publicKey: env.VAPI_PUBLIC_KEY,
    },

    elevenlabs: {
      apiKey: env.ELEVENLABS_API_KEY,
    },
  };
};
