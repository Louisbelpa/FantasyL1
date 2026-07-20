import type { Player, Position } from "@/types";
import { MAX_PER_CLUB, SQUAD_COMPOSITION } from "@/lib/constants";
import { clubCounts } from "@/lib/transfers";

/** Bornes par poste pour les 11 titulaires (règles type FPL). */
export const FORMATION_LIMITS: Record<Position, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

function lineCounts(starters: Player[]): Record<Position, number> {
  const counts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of starters) counts[p.position] += 1;
  return counts;
}

/**
 * Vérifie qu'un titulaire et un remplaçant peuvent être échangés sans
 * casser la formation. Renvoie un message d'erreur, ou null si valide.
 */
export function substitutionBlockReason(
  squad: Player[],
  aId: number,
  bId: number,
): string | null {
  const a = squad.find((p) => p.id === aId);
  const b = squad.find((p) => p.id === bId);
  if (!a || !b) return "Joueur introuvable.";
  if (a.isStarter === b.isStarter)
    return "L'échange doit se faire entre un titulaire et un remplaçant.";

  const starter = a.isStarter ? a : b;
  const bench = a.isStarter ? b : a;
  if (starter.position === bench.position) return null;
  if (starter.position === "GK" || bench.position === "GK")
    return "Un gardien ne peut être remplacé que par un gardien.";

  const counts = lineCounts(squad.filter((p) => p.isStarter));
  counts[starter.position] -= 1;
  counts[bench.position] += 1;
  for (const pos of ["DEF", "MID", "FWD"] as const) {
    if (counts[pos] < FORMATION_LIMITS[pos].min)
      return `Il faut au moins ${FORMATION_LIMITS[pos].min} ${pos === "DEF" ? "défenseurs" : pos === "MID" ? "milieux" : "attaquant(s)"}.`;
    if (counts[pos] > FORMATION_LIMITS[pos].max)
      return `Maximum ${FORMATION_LIMITS[pos].max} joueurs sur cette ligne.`;
  }
  return null;
}

/**
 * Échange titulaire ↔ remplaçant. Si le sortant portait le brassard
 * (capitaine ou vice), il passe à l'entrant : le capitaine reste
 * toujours titulaire.
 */
export function applySubstitution(squad: Player[], aId: number, bId: number): Player[] {
  const a = squad.find((p) => p.id === aId);
  const b = squad.find((p) => p.id === bId);
  if (!a || !b) return squad;
  const starter = a.isStarter ? a : b;
  const bench = a.isStarter ? b : a;
  return squad.map((p) => {
    if (p.id === starter.id)
      return { ...p, isStarter: false, isCaptain: false, isViceCaptain: false };
    if (p.id === bench.id)
      return {
        ...p,
        isStarter: true,
        isCaptain: starter.isCaptain ?? false,
        isViceCaptain: starter.isViceCaptain ?? false,
      };
    return p;
  });
}

/**
 * Donne le brassard de capitaine à un titulaire. Si le joueur était
 * vice-capitaine, les deux rôles sont échangés.
 */
export function applyCaptain(squad: Player[], id: number): Player[] {
  const target = squad.find((p) => p.id === id);
  if (!target || !target.isStarter || target.isCaptain) return squad;
  const wasVice = target.isViceCaptain === true;
  return squad.map((p) => {
    if (p.id === id) return { ...p, isCaptain: true, isViceCaptain: false };
    if (p.isCaptain) return { ...p, isCaptain: false, isViceCaptain: wasVice };
    return p;
  });
}

/** Donne le rôle de vice-capitaine à un titulaire (échange si capitaine). */
export function applyViceCaptain(squad: Player[], id: number): Player[] {
  const target = squad.find((p) => p.id === id);
  if (!target || !target.isStarter || target.isViceCaptain) return squad;
  const wasCaptain = target.isCaptain === true;
  return squad.map((p) => {
    if (p.id === id) return { ...p, isViceCaptain: true, isCaptain: false };
    if (p.isViceCaptain) return { ...p, isViceCaptain: false, isCaptain: wasCaptain };
    return p;
  });
}

/**
 * Validation complète d'un effectif : composition à 15, formation des
 * titulaires, brassards uniques portés par des titulaires, limite club.
 */
export function squadInvalidReason(squad: Player[]): string | null {
  for (const pos of Object.keys(SQUAD_COMPOSITION) as Position[]) {
    const count = squad.filter((p) => p.position === pos).length;
    if (count !== SQUAD_COMPOSITION[pos])
      return `L'effectif doit compter ${SQUAD_COMPOSITION[pos]} joueur(s) au poste ${pos}.`;
  }

  const starters = squad.filter((p) => p.isStarter);
  if (starters.length !== 11) return "Il faut exactement 11 titulaires.";
  const counts = lineCounts(starters);
  for (const pos of Object.keys(FORMATION_LIMITS) as Position[]) {
    const { min, max } = FORMATION_LIMITS[pos];
    if (counts[pos] < min || counts[pos] > max)
      return "Formation des titulaires invalide.";
  }

  const captains = squad.filter((p) => p.isCaptain);
  const vices = squad.filter((p) => p.isViceCaptain);
  if (captains.length !== 1 || !captains[0].isStarter)
    return "Il faut exactement un capitaine, titulaire.";
  if (vices.length !== 1 || !vices[0].isStarter)
    return "Il faut exactement un vice-capitaine, titulaire.";
  if (captains[0].id === vices[0].id)
    return "Capitaine et vice-capitaine doivent être différents.";

  for (const [club, count] of Object.entries(clubCounts(squad))) {
    if (count > MAX_PER_CLUB)
      return `Maximum ${MAX_PER_CLUB} joueurs du club ${club}.`;
  }
  return null;
}
