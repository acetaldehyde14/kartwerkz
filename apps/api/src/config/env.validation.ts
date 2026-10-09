import { z } from 'zod';

/**
 * Fail-fast environment validation. Runs once at bootstrap via
 * ConfigModule.forRoot({ validate }). Required vars throw immediately;
 * optional vars (Stripe, SMTP) are allowed to be blank in development —
 * see CheckoutModule's DevPaymentAdapter and the worker's mail fallback.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  S3_ENDPOINT: z.string().min(1, 'S3_ENDPOINT is required'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
  S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  S3_BUCKET_UPLOADS: z.string().min(1, 'S3_BUCKET_UPLOADS is required'),
  S3_BUCKET_ARTWORK: z.string().min(1, 'S3_BUCKET_ARTWORK is required'),

  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET is required (min 16 chars)'),
  SESSION_COOKIE_NAME: z.string().default('kw_session'),
  GUEST_SESSION_COOKIE_NAME: z.string().default('kw_guest'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),

  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  STRIPE_SUCCESS_URL: z.string().optional().default('http://localhost:3000/checkout/success'),
  STRIPE_CANCEL_URL: z.string().optional().default('http://localhost:3000/checkout/cancel'),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('Kartwerkz <no-reply@kartwerkz.local>'),

  DEFAULT_CURRENCY: z.string().default('SGD'),
  DEV_BASE_PRICE_MINOR_UNITS: z.coerce.number().int().positive().default(89900),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
