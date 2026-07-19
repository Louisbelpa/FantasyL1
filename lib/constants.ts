import type { Club, ClubCode, Position } from "@/types";

export const CLUBS: Record<ClubCode, Club> = {
  PSG: { code: "PSG", name: "Paris Saint-Germain", primary: "#1a3a6b", secondary: "#e30613" },
  OM: { code: "OM", name: "Olympique de Marseille", primary: "#f4f6f9", secondary: "#2faee0" },
  OL: { code: "OL", name: "Olympique Lyonnais", primary: "#f4f6f9", secondary: "#da001a" },
  ASM: { code: "ASM", name: "AS Monaco", primary: "#e30613", secondary: "#f4f6f9" },
  LOSC: { code: "LOSC", name: "LOSC Lille", primary: "#e01e13", secondary: "#1b2c5c" },
  RCL: { code: "RCL", name: "RC Lens", primary: "#fdd835", secondary: "#e30613" },
  SRFC: { code: "SRFC", name: "Stade Rennais", primary: "#e30613", secondary: "#111111" },
  OGCN: { code: "OGCN", name: "OGC Nice", primary: "#c8102e", secondary: "#111111" },
  SB29: { code: "SB29", name: "Stade Brestois", primary: "#e30613", secondary: "#f4f6f9" },
  TFC: { code: "TFC", name: "Toulouse FC", primary: "#5f3a8e", secondary: "#f4f6f9" },
  RCSA: { code: "RCSA", name: "RC Strasbourg", primary: "#2196f3", secondary: "#f4f6f9" },
};

export const POSITION_LABELS: Record<Position, string> = {
  GK: "Gardien",
  DEF: "Défenseur",
  MID: "Milieu",
  FWD: "Attaquant",
};

export const POSITION_SHORT: Record<Position, string> = {
  GK: "GAR",
  DEF: "DÉF",
  MID: "MIL",
  FWD: "ATT",
};

/** Ordre d'affichage des lignes sur le terrain (gardien en haut, comme FPL). */
export const PITCH_LINES: Position[] = ["GK", "DEF", "MID", "FWD"];

/** Budget total alloué à la création de l'équipe, en millions d'euros. */
export const TOTAL_BUDGET = 100;
