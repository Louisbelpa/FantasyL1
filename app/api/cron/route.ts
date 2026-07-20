import { NextResponse } from "next/server";
import { currentGameweek, isDeadlinePassed } from "@/lib/gameweek";
import { runSettlement } from "@/lib/settle-run";
import { getTeam, listUserIds } from "@/lib/store";

/**
 * Cron de clôture (Vercel Cron ou tout planificateur HTTP) : clôture
 * la journée de chaque manager dont la deadline est passée. Idempotent
 * — après clôture, la deadline suivante est dans le futur et le
 * manager est ignoré aux passages suivants. Protégé par CRON_SECRET
 * (Vercel envoie automatiquement `Authorization: Bearer <secret>`).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const results: Array<{ userId: string; status: string }> = [];
  for (const userId of await listUserIds()) {
    const team = await getTeam(userId);
    if (!team.onboarded) {
      results.push({ userId, status: "ignoré (pas d'équipe)" });
      continue;
    }
    if (!isDeadlinePassed(currentGameweek(team))) {
      results.push({ userId, status: "ignoré (deadline à venir)" });
      continue;
    }
    const result = await runSettlement(userId);
    results.push({
      userId,
      status: result.ok ? "journée clôturée" : `erreur : ${result.error}`,
    });
  }
  return NextResponse.json({ results });
}
