import type {
  Gameweek,
  League,
  ManagerStats,
  Player,
  RivalManager,
} from "@/types";
import gameweekJson from "@/data/gameweek.json";
import leaguesJson from "@/data/leagues.json";
import managerJson from "@/data/manager.json";
import managersJson from "@/data/managers.json";
import marketJson from "@/data/market.json";
import playersJson from "@/data/players.json";

// Les JSON sont des mocks en attendant l'API de statistiques sportives ;
// le cast est le seul point où le typage n'est pas vérifié par le compilateur.
export const players = playersJson as Player[];
/** Joueurs disponibles sur le marché des transferts (hors effectif). */
export const marketPlayers = marketJson as Player[];
export const gameweek = gameweekJson as Gameweek;
export const managerStats = managerJson as ManagerStats;
/** Managers fictifs peuplant classements et ligues. */
export const rivalManagers = managersJson as RivalManager[];
/** Ligues mock existantes (rejoignables par code). */
export const mockLeagues = leaguesJson as League[];
