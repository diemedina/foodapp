import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { withVerifiedSsl } from "./src/db/url";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

// Las migraciones van por la conexión directa (sin pooler), como recomienda Neon.
// `neon env pull` escribe ambas: DATABASE_URL (pooled) y DATABASE_URL_UNPOOLED (directa).
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: withVerifiedSsl(url!) },
});
