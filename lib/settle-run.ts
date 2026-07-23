import { revalidatePath } from "next/cache";
import type { Gameweek, Player, PlayerMatchStats } from "@/types";
import {
  fetchFixturePlayerStats,
  fetchNextGameweek,
  fetchRoundFixtures,
  isApiConfigured,
} from "@/lib/api/apiFootball";
import { marketPlayers, players as mockPlayers } from "@/lib/data";
import { currentGameweek } from "@/lib/gameweek";
import { scoreList, settleGameweek } from "@/lib/settlement";
import { simulateGameweekStats } from "@/lib/simulate";
import { getGlobal, getTeam, listUserIds, saveGlobal, saveTeam } from "@/lib/store";

export type SettleResult =
  | { ok: true; settled: number }
  | { ok: false; error: string };

/**
 * Clôture la journée globale : calcule les stats une seule fois (matchs
 * réels en mode API — journée terminée exigée —, simulation sinon),
 * crédite chaque manager, met à jour le catalogue partagé et avance la
 * journée pour tout le monde.
 */
export async function runSettlementAll(): Promise<SettleResult> {
  const global = await getGlobal();
  const current = currentGameweek(global);

  try {
    const userIds = await listUserIds();
    const teams = await Promise.all(userIds.map((id) => getTeam(id)));

    let statsById: Map<number, PlayerMatchStats>;
    let nextGameweek: Gameweek;

    if (global.dataSource === "api" && isApiConfigured()) {
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
      nextGameweek = (await fetchNextGameweek()).gameweek;
    } else {
      // Un même joueur reçoit les mêmes stats simulées pour tous.
      const pool = new Map<number, Player>();
      for (const p of [
        ...(global.catalogue ?? [...mockPlayers, ...marketPlayers]),
        ...teams.flatMap((t) => t.squad),
      ])
        pool.set(p.id, p);
      statsById = simulateGameweekStats([...pool.values()], current.id);
      nextGameweek = {
        id: current.id + 1,
        name: `Journée ${current.id + 1}`,
        deadline: new Date(
          new Date(current.deadline).getTime() + 7 * 86_400_000,
        ).toISOString(),
      };
    }

    let settled = 0;
    for (let i = 0; i < userIds.length; i++) {
      if (!teams[i].onboarded) continue;
      const result = settleGameweek(teams[i], statsById, current);
      await saveTeam(userIds[i], result.team);
      settled += 1;
    }

    await saveGlobal({
      ...global,
      catalogue: global.catalogue
        ? scoreList(global.catalogue, statsById, current.id)
        : null,
      gameweek: nextGameweek,
    });

    revalidatePath("/equipe");
    revalidatePath("/transferts");
    revalidatePath("/classements");
    return { ok: true, settled };
  } catch (cause) {
    return {
      ok: false,
      error: `Échec de la clôture : ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    };
  }
}
