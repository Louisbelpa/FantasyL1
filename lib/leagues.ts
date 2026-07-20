import type { League, RivalManager } from "@/types";
import { managerStats, mockLeagues, rivalManagers } from "@/lib/data";
import type { TeamState } from "@/lib/store";

/** Toutes les ligues connues : mock + celles créées par le manager. */
export function allLeagues(team: TeamState): League[] {
  return [...mockLeagues, ...team.customLeagues];
}

export function findLeagueById(team: TeamState, id: string): League | undefined {
  return allLeagues(team).find((l) => l.id === id);
}

export function findLeagueByCode(team: TeamState, code: string): League | undefined {
  const normalized = code.trim().toUpperCase();
  return allLeagues(team).find((l) => l.code.toUpperCase() === normalized);
}

export interface RankingRow {
  rank: number;
  teamName: string;
  managerName: string;
  gameweekPoints: number;
  totalPoints: number;
  isUser: boolean;
}

/** Points de l'utilisateur affichés dans les classements. */
export interface UserPoints {
  gameweekPoints: number;
  totalPoints: number;
  teamName?: string;
}

function userAsRival(user?: UserPoints): Omit<RivalManager, "id" | "previousRank"> {
  return {
    teamName: user?.teamName ?? managerStats.teamName,
    managerName: managerStats.managerName,
    gameweekPoints: user?.gameweekPoints ?? managerStats.gameweekPoints,
    totalPoints: user?.totalPoints ?? managerStats.totalPoints,
  };
}

/**
 * Classement d'une ligue : membres fictifs + l'utilisateur s'il en est
 * membre, triés par points totaux (départage aux points de la journée).
 */
export function leagueTable(
  league: League,
  userIsMember: boolean,
  user?: UserPoints,
): RankingRow[] {
  const rows = rivalManagers
    .filter((r) => league.memberIds.includes(r.id))
    .map((r) => ({ ...r, isUser: false }));
  const entries: (typeof rows[number] | (ReturnType<typeof userAsRival> & { isUser: true }))[] =
    userIsMember ? [...rows, { ...userAsRival(user), isUser: true }] : rows;

  return entries
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints || b.gameweekPoints - a.gameweekPoints,
    )
    .map((entry, i) => ({
      rank: i + 1,
      teamName: entry.teamName,
      managerName: entry.managerName,
      gameweekPoints: entry.gameweekPoints,
      totalPoints: entry.totalPoints,
      isUser: entry.isUser,
    }));
}

/** Rang de l'utilisateur dans une ligue dont il est membre. */
export function userRankInLeague(league: League, user?: UserPoints): number {
  const row = leagueTable(league, true, user).find((r) => r.isUser);
  return row?.rank ?? 0;
}
