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

    openrouter: {
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL,
    },
  };
};
