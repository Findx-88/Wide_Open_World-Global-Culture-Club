import { defineConfig } from 'drizzle-kit';

// Only used to *generate* SQL migrations from src/server/db/schema.ts.
// Migrations are applied to Cloudflare D1 by scripts/migrate.ts.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
});
