import type { Gameweek } from "@/types";
import { gameweek as mockGameweek } from "@/lib/data";
import type { GlobalState } from "@/lib/store";

/** Journée en cours (globale) : celle du store partagé, sinon le mock. */
export function currentGameweek(global: GlobalState): Gameweek {
  return global.gameweek ?? mockGameweek;
}

/**
 * Vrai entre la deadline et la clôture de la journée : les équipes
 * sont alors verrouillées (transferts, remplacements, brassards, jetons).
 */
export function isDeadlinePassed(gameweek: Gameweek): boolean {
  return Date.now() >= new Date(gameweek.deadline).getTime();
}
