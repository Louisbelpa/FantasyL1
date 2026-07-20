export type Position = "GK" | "DEF" | "MID" | "FWD";

export type PlayerStatus = "fit" | "doubtful" | "injured";

export interface Player {
  id: number;
  /** Nom d'affichage (joueur fictif). */
  name: string;
  /** Code club (voir CLUBS dans lib/constants.ts). */
  club: ClubCode;
  position: Position;
  /** Prix en millions d'euros. */
  price: number;
  totalPoints: number;
  gameweekPoints: number;
  /** Prochain adversaire, ex. "OM (Dom)". */
  nextOpponent: string;
  status: PlayerStatus;
  isStarter: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

export type ClubCode =
  | "PSG"
  | "OM"
  | "OL"
  | "ASM"
  | "LOSC"
  | "RCL"
  | "SRFC"
  | "OGCN"
  | "SB29"
  | "TFC"
  | "RCSA"
  | "FCN";

export interface Club {
  code: ClubCode;
  name: string;
  /** Couleur principale du maillot. */
  primary: string;
  /** Couleur des manches / texte du maillot. */
  secondary: string;
}

export interface Gameweek {
  id: number;
  /** Ex. "Journée 1". */
  name: string;
  /** Date limite de composition (ISO 8601). */
  deadline: string;
}

/** Jetons bonus activables, à la FPL. */
export type ChipName = "tripleCaptain" | "benchBoost" | "wildcard" | "freeHit";

export type ChipStatus = "available" | "active" | "used";

export type Chips = Record<ChipName, ChipStatus>;

/** Manager fictif peuplant les classements et les ligues. */
export interface RivalManager {
  id: number;
  teamName: string;
  managerName: string;
  gameweekPoints: number;
  totalPoints: number;
  /** Rang au classement général à la journée précédente. */
  previousRank: number;
}

export type LeagueType = "privée" | "publique";

export interface League {
  id: string;
  name: string;
  /** Code d'invitation à partager. */
  code: string;
  type: LeagueType;
  /** Ids des RivalManager membres (l'utilisateur s'ajoute via le store). */
  memberIds: number[];
}

export interface ManagerStats {
  teamName: string;
  managerName: string;
  gameweekPoints: number;
  totalPoints: number;
  overallRank: number;
  /** Rang général à la journée précédente (pour la tendance ▲▼). */
  previousOverallRank: number;
  gameweekRank: number;
  /** Budget restant en banque, en millions d'euros. */
  bank: number;
  /** Valeur totale de l'équipe, en millions d'euros. */
  teamValue: number;
  freeTransfers: number;
}
