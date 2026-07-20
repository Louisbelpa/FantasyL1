import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import RankingsView from "@/components/rankings/RankingsView";
import type { RankingTableRow } from "@/components/rankings/RankingTable";
import { managerStats, rivalManagers } from "@/lib/data";
import { computeTeamGameweekPoints } from "@/lib/scoring";
import { getTeam } from "@/lib/store";
import { formatRank } from "@/lib/team";

export const metadata: Metadata = { title: "Classements" };

// Les points de l'utilisateur sont lus depuis le store serveur.
export const dynamic = "force-dynamic";

export default async function ClassementsPage() {
  const team = await getTeam();
  const general: RankingTableRow[] = [...rivalManagers]
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints || b.gameweekPoints - a.gameweekPoints,
    )
    .map((r, i) => ({
      rank: i + 1,
      teamName: r.teamName,
      managerName: r.managerName,
      gameweekPoints: r.gameweekPoints,
      totalPoints: r.totalPoints,
      isUser: false,
      movement: r.previousRank - (i + 1),
    }));

  const gameweekRows: RankingTableRow[] = [...rivalManagers]
    .sort(
      (a, b) =>
        b.gameweekPoints - a.gameweekPoints || b.totalPoints - a.totalPoints,
    )
    .map((r, i) => ({
      rank: i + 1,
      teamName: r.teamName,
      managerName: r.managerName,
      gameweekPoints: r.gameweekPoints,
      totalPoints: r.totalPoints,
      isUser: false,
    }));

  const userRow = {
    teamName: managerStats.teamName,
    managerName: managerStats.managerName,
    gameweekPoints: computeTeamGameweekPoints(team.squad, team.chips),
    totalPoints: team.seasonPoints,
    isUser: true,
  };
  const pinnedGeneral: RankingTableRow = {
    ...userRow,
    rank: managerStats.overallRank,
    rankLabel: formatRank(managerStats.overallRank),
    movement: managerStats.previousOverallRank - managerStats.overallRank,
  };
  const pinnedGameweek: RankingTableRow = {
    ...userRow,
    rank: managerStats.gameweekRank,
    rankLabel: formatRank(managerStats.gameweekRank),
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Classements"
        subtitle="Suivez votre progression au classement général et par journée."
      />
      <RankingsView
        general={general}
        gameweekRows={gameweekRows}
        pinnedGeneral={pinnedGeneral}
        pinnedGameweek={pinnedGameweek}
      />
    </main>
  );
}
