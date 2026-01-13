import { z } from 'zod';

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_GUILD_ID: z.string().optional(),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

export function getEnv(): Env {
  if (!env) {
    try {
      env = envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missing = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Environment validation failed: ${missing}`);
      }
      throw error;
    }
  }
  return env;
}
