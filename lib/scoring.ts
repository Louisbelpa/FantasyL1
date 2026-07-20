import type { Chips, Player, PlayerMatchStats, Position } from "@/types";
import { activeChip } from "@/lib/chips";

/** Barème de points fantasy, calqué sur celui de la FPL. */
export const SCORING = {
  /** Entré en jeu (moins de 60 minutes). */
  appearance: 1,
  /** 60 minutes jouées ou plus. */
  fullAppearance: 2,
  goal: { GK: 6, DEF: 6, MID: 5, FWD: 4 } as Record<Position, number>,
  assist: 3,
  cleanSheet: { GK: 4, DEF: 4, MID: 1, FWD: 0 } as Record<Position, number>,
  /** 1 point par tranche de 3 arrêts (gardien). */
  savesPerPoint: 3,
  penaltySaved: 5,
  penaltyMissed: -2,
  /** −1 point par tranche de 2 buts encaissés (GAR/DÉF). */
  goalsConcededPerPenalty: 2,
  yellowCard: -1,
  redCard: -3,
  ownGoal: -2,
} as const;

/**
 * Points fantasy d'un joueur sur une journée à partir de ses stats
 * brutes. Utilisé par la synchronisation API après chaque journée.
 */
export function scorePlayerGameweek(
  stats: PlayerMatchStats,
  position: Position,
): number {
  if (stats.minutes <= 0) return 0;

  let points =
    stats.minutes >= 60 ? SCORING.fullAppearance : SCORING.appearance;
  points += stats.goals * SCORING.goal[position];
  points += stats.assists * SCORING.assist;
  if (stats.cleanSheet && stats.minutes >= 60)
    points += SCORING.cleanSheet[position];
  if (position === "GK")
    points += Math.floor(stats.saves / SCORING.savesPerPoint);
  points += stats.penaltiesSaved * SCORING.penaltySaved;
  points += stats.penaltiesMissed * SCORING.penaltyMissed;
  if (position === "GK" || position === "DEF")
    points -= Math.floor(stats.goalsConceded / SCORING.goalsConcededPerPenalty);
  points += stats.yellowCards * SCORING.yellowCard;
  points += stats.redCards * SCORING.redCard;
  points += stats.ownGoals * SCORING.ownGoal;
  return points;
}

/**
 * Points de la journée de l'équipe : titulaires + capitaine doublé
 * (triplé sous Triple Capitaine), banc inclus sous Bench Boost. Si le
 * capitaine n'a pas joué (0 point et pas de stats), le vice-capitaine
 * prend le brassard.
 */
export function computeTeamGameweekPoints(squad: Player[], chips: Chips): number {
  const chip = activeChip(chips);
  const starters = squad.filter((p) => p.isStarter);
  const bench = squad.filter((p) => !p.isStarter);

  const base = starters.reduce((acc, p) => acc + p.gameweekPoints, 0);

  const captain = starters.find((p) => p.isCaptain);
  const vice = starters.find((p) => p.isViceCaptain);
  const armband = captain && captain.gameweekPoints > 0 ? captain : (vice ?? captain);
  const multiplier = chip === "tripleCaptain" ? 3 : 2;
  const captainExtra = armband ? armband.gameweekPoints * (multiplier - 1) : 0;

  const benchPoints =
    chip === "benchBoost"
      ? bench.reduce((acc, p) => acc + p.gameweekPoints, 0)
      : 0;

  return base + captainExtra + benchPoints;
}
