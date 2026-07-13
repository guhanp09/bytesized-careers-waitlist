import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load local env for CLI usage (drizzle-kit runs outside Next's runtime).
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
