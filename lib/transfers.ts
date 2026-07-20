import type { ClubCode, Player } from "@/types";
import { MAX_PER_CLUB, TRANSFER_POINT_COST } from "@/lib/constants";

/** Nombre de joueurs de chaque club dans l'effectif. */
export function clubCounts(squad: Player[]): Partial<Record<ClubCode, number>> {
  const counts: Partial<Record<ClubCode, number>> = {};
  for (const p of squad) counts[p.club] = (counts[p.club] ?? 0) + 1;
  return counts;
}

/** Ids entrés dans l'effectif par rapport à l'effectif de départ. */
export function countTransfers(initialSquad: Player[], squad: Player[]): number {
  const initialIds = new Set(initialSquad.map((p) => p.id));
  return squad.filter((p) => !initialIds.has(p.id)).length;
}

/**
 * Banque restante : la banque de départ ajustée de la différence de
 * valeur entre l'effectif de départ et l'effectif courant.
 */
export function computeBank(
  initialBank: number,
  initialSquad: Player[],
  squad: Player[],
): number {
  const sum = (list: Player[]) => list.reduce((acc, p) => acc + p.price, 0);
  // Les prix sont des multiples de 0,1 M€ : on arrondit pour éviter
  // les résidus flottants (ex. 4.000000000000001).
  return Math.round((initialBank + sum(initialSquad) - sum(squad)) * 10) / 10;
}

/** Coût en points des transferts au-delà des transferts gratuits. */
export function transfersPointCost(transfers: number, freeTransfers: number): number {
  return Math.max(0, transfers - freeTransfers) * TRANSFER_POINT_COST;
}

export type BuyBlock = "budget" | "club-limit" | null;

/**
 * Vérifie si `incoming` peut remplacer `outgoing` dans l'effectif :
 * budget suffisant et limite de joueurs par club respectée.
 */
export function buyBlockReason(
  squad: Player[],
  bank: number,
  outgoing: Player,
  incoming: Player,
): BuyBlock {
  if (bank + outgoing.price - incoming.price < -1e-9) return "budget";
  const sameClub = squad.filter(
    (p) => p.club === incoming.club && p.id !== outgoing.id,
  ).length;
  if (sameClub >= MAX_PER_CLUB) return "club-limit";
  return null;
}

/**
 * Remplace `outgoing` par `incoming` en conservant le rôle du sortant
 * (titulaire/banc, capitaine, vice-capitaine).
 */
export function swapPlayer(
  squad: Player[],
  outgoing: Player,
  incoming: Player,
): Player[] {
  return squad.map((p) =>
    p.id === outgoing.id
      ? {
          ...incoming,
          isStarter: outgoing.isStarter,
          isCaptain: outgoing.isCaptain,
          isViceCaptain: outgoing.isViceCaptain,
        }
      : p,
  );
}
