import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import type { TeamState } from "@/lib/store";

/**
 * Backend Postgres (Neon en production, n'importe quel Postgres en
 * local) via Drizzle. Un enregistrement JSONB par manager : le modèle
 * relationnel fin (joueurs, ligues partagées) viendra avec le vrai
 * multi-joueurs. Activé par DATABASE_URL.
 */

export const teams = pgTable("fantasy_teams", {
  userId: text("user_id").primaryKey(),
  state: jsonb("state").notNull().$type<TeamState>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

let db: NodePgDatabase | undefined;
let schemaReady: Promise<unknown> | undefined;

function getDb(): NodePgDatabase {
  db ??= drizzle(new Pool({ connectionString: process.env.DATABASE_URL }));
  return db;
}

/** Crée la table au premier accès — pas encore de vraies migrations. */
async function ensureSchema(): Promise<void> {
  schemaReady ??= getDb().execute(sql`
    CREATE TABLE IF NOT EXISTS fantasy_teams (
      user_id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await schemaReady;
}

export async function dbGetTeam(userId: string): Promise<TeamState | null> {
  await ensureSchema();
  const rows = await getDb()
    .select({ state: teams.state })
    .from(teams)
    .where(eq(teams.userId, userId));
  return rows[0]?.state ?? null;
}

export async function dbSaveTeam(userId: string, state: TeamState): Promise<void> {
  await ensureSchema();
  await getDb()
    .insert(teams)
    .values({ userId, state, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: teams.userId,
      set: { state, updatedAt: new Date() },
    });
}
