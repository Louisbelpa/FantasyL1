import type { Gameweek, ManagerStats, Player } from "@/types";
import gameweekJson from "@/data/gameweek.json";
import managerJson from "@/data/manager.json";
import playersJson from "@/data/players.json";

// Les JSON sont des mocks en attendant l'API de statistiques sportives ;
// le cast est le seul point où le typage n'est pas vérifié par le compilateur.
export const players = playersJson as Player[];
export const gameweek = gameweekJson as Gameweek;
export const managerStats = managerJson as ManagerStats;
