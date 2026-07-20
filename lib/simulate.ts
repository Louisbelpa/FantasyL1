import type { Player, PlayerMatchStats } from "@/types";

/**
 * Simulation d'une journée en mode mock (sans clé API) : des stats
 * plausibles et déterministes (même graine → même journée) passées au
 * vrai moteur de points, pour jouer tout le cycle de vie du jeu.
 */

/** PRNG mulberry32 : déterministe pour une graine donnée. */
function makeRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOAL_PROBABILITY = { GK: 0, DEF: 0.06, MID: 0.18, FWD: 0.35 } as const;
const ASSIST_PROBABILITY = { GK: 0.02, DEF: 0.1, MID: 0.25, FWD: 0.2 } as const;

export function simulateGameweekStats(
  players: Player[],
  gameweekId: number,
): Map<number, PlayerMatchStats> {
  const stats = new Map<number, PlayerMatchStats>();
  for (const player of players) {
    const rng = makeRng(gameweekId * 10_007 + player.id);

    // Un blessé ne joue pas ; sinon ~12 % de chance de rester en tribune.
    const played = player.status !== "injured" && rng() > 0.12;
    const minutes = !played
      ? 0
      : rng() < 0.15
        ? 1 + Math.floor(rng() * 59)
        : 60 + Math.floor(rng() * 31);

    const goals =
      minutes > 0
        ? (rng() < GOAL_PROBABILITY[player.position] ? 1 : 0) +
          (rng() < GOAL_PROBABILITY[player.position] / 4 ? 1 : 0)
        : 0;
    const assists =
      minutes > 0 && rng() < ASSIST_PROBABILITY[player.position] ? 1 : 0;
    const cleanSheet = minutes > 0 && rng() < 0.35;
    const goalsConceded = cleanSheet || minutes === 0 ? 0 : 1 + (rng() < 0.3 ? 1 : 0);

    stats.set(player.id, {
      playerId: player.id,
      minutes,
      goals,
      assists,
      cleanSheet,
      goalsConceded,
      saves: player.position === "GK" && minutes > 0 ? Math.floor(rng() * 7) : 0,
      penaltiesSaved:
        player.position === "GK" && minutes > 0 && rng() < 0.04 ? 1 : 0,
      penaltiesMissed: minutes > 0 && rng() < 0.02 ? 1 : 0,
      yellowCards: minutes > 0 && rng() < 0.15 ? 1 : 0,
      redCards: minutes > 0 && rng() < 0.02 ? 1 : 0,
      ownGoals: minutes > 0 && rng() < 0.01 ? 1 : 0,
    });
  }
  return stats;
}
