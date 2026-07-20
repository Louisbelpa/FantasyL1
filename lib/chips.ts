import type { ChipName, Chips } from "@/types";

export const CHIP_INFO: Record<
  ChipName,
  { label: string; description: string }
> = {
  tripleCaptain: {
    label: "Triple Capitaine",
    description: "Votre capitaine rapporte ×3 au lieu de ×2 sur cette journée.",
  },
  benchBoost: {
    label: "Bench Boost",
    description: "Les points de vos 4 remplaçants comptent aussi cette journée.",
  },
  wildcard: {
    label: "Joker",
    description: "Transferts illimités et gratuits jusqu'à la deadline.",
  },
  freeHit: {
    label: "Free Hit",
    description:
      "Refaites librement votre équipe pour une journée ; elle sera restaurée ensuite.",
  },
};

export const CHIP_NAMES = Object.keys(CHIP_INFO) as ChipName[];

/** Le jeton actuellement actif, ou null. Un seul jeton actif à la fois. */
export function activeChip(chips: Chips): ChipName | null {
  return CHIP_NAMES.find((name) => chips[name] === "active") ?? null;
}

/** Vrai si un jeton rendant les transferts gratuits et illimités est actif. */
export function transfersUnlimited(chips: Chips): boolean {
  const active = activeChip(chips);
  return active === "wildcard" || active === "freeHit";
}

export function defaultChips(): Chips {
  return {
    tripleCaptain: "available",
    benchBoost: "available",
    wildcard: "available",
    freeHit: "available",
  };
}
