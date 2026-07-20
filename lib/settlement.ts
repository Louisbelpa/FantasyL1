import type { Gameweek, Player, PlayerMatchStats } from "@/types";
import { activeChip } from "@/lib/chips";
import { computeTeamGameweekPoints, scorePlayerGameweek } from "@/lib/scoring";
import type { TeamState } from "@/lib/store";

/** Plafond de transferts gratuits cumulables (règle FPL). */
const MAX_FREE_TRANSFERS = 5;

function scoreList(
  players: Player[],
  statsById: Map<number, PlayerMatchStats>,
): Player[] {
  return players.map((p) => {
    const stats = statsById.get(p.id);
    const points = stats ? scorePlayerGameweek(stats, p.position) : 0;
    return {
      ...p,
      gameweekPoints: points,
      totalPoints: p.totalPoints + points,
    };
  });
}

/**
 * Clôture une journée : crédite les points de chaque joueur puis de
 * l'équipe (capitaine, jetons), consomme le jeton actif, restaure
 * l'équipe d'avant Free Hit le cas échéant, rend un transfert gratuit
 * et avance à la journée suivante. Fonction pure : renvoie le nouvel
 * état sans le persister.
 */
export function settleGameweek(
  team: TeamState,
  statsById: Map<number, PlayerMatchStats>,
  settled: { id: number; name: string },
  nextGameweek: Gameweek,
): { team: TeamState; points: number } {
  const scoredSquad = scoreList(team.squad, statsById);
  const points = computeTeamGameweekPoints(scoredSquad, team.chips);

  const chip = activeChip(team.chips);
  const chips = chip ? { ...team.chips, [chip]: "used" as const } : team.chips;

  // Free Hit : l'équipe d'origine revient après la journée, avec ses
  // points de journée recalculés pour l'affichage.
  const squad =
    chip === "freeHit" && team.freeHitSnapshot
      ? scoreList(team.freeHitSnapshot.squad, statsById)
      : scoredSquad;
  const bank =
    chip === "freeHit" && team.freeHitSnapshot
      ? team.freeHitSnapshot.bank
      : team.bank;

  return {
    points,
    team: {
      ...team,
      squad,
      bank,
      chips,
      freeHitSnapshot: chip === "freeHit" ? null : team.freeHitSnapshot,
      catalogue: team.catalogue ? scoreList(team.catalogue, statsById) : null,
      freeTransfers: Math.min(MAX_FREE_TRANSFERS, team.freeTransfers + 1),
      seasonPoints: team.seasonPoints + points,
      gameweekHistory: [
        ...team.gameweekHistory,
        { id: settled.id, name: settled.name, points, chip },
      ],
      apiGameweek: nextGameweek,
    },
  };
}
