import { NextResponse } from "next/server";
import { currentGameweek, isDeadlinePassed } from "@/lib/gameweek";
import { runSettlementAll } from "@/lib/settle-run";
import { getGlobal } from "@/lib/store";

/**
 * Cron de clôture (Vercel Cron ou tout planificateur HTTP) : clôture la
 * journée globale si sa deadline est passée, pour tous les managers en
 * une passe. Idempotent — après clôture, la journée suivante a une
 * deadline dans le futur et les passages suivants n'ont rien à faire.
 * Protégé par CRON_SECRET (Vercel envoie automatiquement
 * `Authorization: Bearer <secret>`).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const global = await getGlobal();
  if (!isDeadlinePassed(currentGameweek(global)))
    return NextResponse.json({ status: "ignoré (deadline à venir)" });

  const result = await runSettlementAll();
  return result.ok
    ? NextResponse.json({ status: "journée clôturée", managers: result.settled })
    : NextResponse.json({ status: "erreur", error: result.error }, { status: 500 });
}
