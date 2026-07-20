import type { Gameweek } from "@/types";
import { gameweek as mockGameweek } from "@/lib/data";
import type { TeamState } from "@/lib/store";

/** Journée en cours : celle synchronisée depuis l'API, sinon le mock. */
export function currentGameweek(team: TeamState): Gameweek {
  return team.apiGameweek ?? mockGameweek;
}

/**
 * Vrai entre la deadline et la clôture de la journée : l'équipe est
 * alors verrouillée (transferts, remplacements, brassards, jetons).
 */
export function isDeadlinePassed(gameweek: Gameweek): boolean {
  return Date.now() >= new Date(gameweek.deadline).getTime();
}
