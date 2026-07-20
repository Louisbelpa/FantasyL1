import { revalidatePath } from "next/cache";
import type { Gameweek, PlayerMatchStats } from "@/types";
import {
  fetchFixturePlayerStats,
  fetchRoundFixtures,
  isApiConfigured,
} from "@/lib/api/apiFootball";
import { currentGameweek } from "@/lib/gameweek";
import { settleGameweek } from "@/lib/settlement";
import { simulateGameweekStats } from "@/lib/simulate";
import { getTeam, saveTeam } from "@/lib/store";

export type SettleResult = { ok: true } | { ok: false; error: string };

/**
 * Clôture la journée en cours d'un manager. Partagé entre l'action
 * utilisateur (bouton) et l'endpoint cron : stats réelles en mode API
 * (journée terminée exigée), simulées en mode mock.
 */
export async function runSettlement(userId: string): Promise<SettleResult> {
  const team = await getTeam(userId);
  const current = currentGameweek(team);

  try {
    let statsById: Map<number, PlayerMatchStats>;
    let nextGameweek: Gameweek;

    if (team.dataSource === "api" && isApiConfigured()) {
      const fixtures = await fetchRoundFixtures(current.id);
      if (fixtures.length === 0)
        return { ok: false, error: `Aucun match trouvé pour ${current.name}.` };
      if (!fixtures.every((f) => f.finished))
        return {
          ok: false,
          error: `${current.name} n'est pas terminée : clôture impossible avant la fin des matchs.`,
        };
      const all: PlayerMatchStats[] = [];
      for (const fixture of fixtures)
        all.push(...(await fetchFixturePlayerStats(fixture.id)));
      statsById = new Map(all.map((s) => [s.playerId, s]));
      const { fetchNextGameweek } = await import("@/lib/api/apiFootball");
      nextGameweek = (await fetchNextGameweek()).gameweek;
    } else {
      statsById = simulateGameweekStats(
        [...team.squad, ...(team.catalogue ?? [])],
        current.id,
      );
      nextGameweek = {
        id: current.id + 1,
        name: `Journée ${current.id + 1}`,
        deadline: new Date(
          new Date(current.deadline).getTime() + 7 * 86_400_000,
        ).toISOString(),
      };
    }

    const { team: settled } = settleGameweek(team, statsById, current, nextGameweek);
    await saveTeam(userId, settled);
    revalidatePath("/");
    revalidatePath("/transferts");
    revalidatePath("/classements");
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error: `Échec de la clôture : ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    };
  }
}
