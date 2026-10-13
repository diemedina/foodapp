import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { withVerifiedSsl } from "./url";

export type DB = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __foodappDb?: DB };

/**
 * Conexión a Lakebase Postgres en Neon.
 *
 * Siguiendo la guía de Neon para apps en Vercel: `node-postgres` (`pg`) contra la URL
 * *pooled* (`DATABASE_URL`, la que escribe `neon env pull`), y `attachDatabasePool` para
 * que Vercel Fluid compute cierre las conexiones ociosas antes de suspender la función.
 * Fuera de Vercel `attachDatabasePool` no hace nada, así que sirve igual en local.
 */
export function getDb(): DB {
  if (globalForDb.__foodappDb) return globalForDb.__foodappDb;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL. Corré `neon env pull` (o completá .env.local a mano).");
  }
  const pool = new Pool({ connectionString: withVerifiedSsl(connectionString), max: 5, idleTimeoutMillis: 10_000 });
  attachDatabasePool(pool);
  const db = drizzle(pool, { schema });
  globalForDb.__foodappDb = db;
  return db;
}

export { schema };
