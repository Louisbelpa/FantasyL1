import type { Player, Position } from "@/types";
import { PITCH_LINES } from "@/lib/constants";

const POSITION_ORDER: Record<Position, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

export function getStarters(players: Player[]): Player[] {
  return players.filter((p) => p.isStarter);
}

export function getBench(players: Player[]): Player[] {
  return players
    .filter((p) => !p.isStarter)
    .sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position]);
}

/**
 * Regroupe les titulaires en lignes de terrain (gardien en haut,
 * attaquants en bas). Avec le mock 4-4-2 : [1, 4, 4, 2].
 */
export function groupByLine(starters: Player[]): Player[][] {
  return PITCH_LINES.map((position) =>
    starters.filter((p) => p.position === position),
  );
}

/** Formation lisible à partir des titulaires, ex. "4-4-2". */
export function getFormationLabel(starters: Player[]): string {
  return (["DEF", "MID", "FWD"] as const)
    .map((pos) => starters.filter((p) => p.position === pos).length)
    .join("-");
}

export function formatPrice(price: number): string {
  return `${price.toFixed(1).replace(".", ",")} M€`;
}

export function formatRank(rank: number): string {
  return new Intl.NumberFormat("fr-FR").format(rank);
}
