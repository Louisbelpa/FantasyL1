import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import LeaguesView, { type LeagueSummary } from "@/components/leagues/LeaguesView";
import { allLeagues, userRankInLeague } from "@/lib/leagues";
import { computeTeamGameweekPoints } from "@/lib/scoring";
import { getTeam } from "@/lib/store";

export const metadata: Metadata = { title: "Ligues" };

// Les adhésions sont lues depuis le store serveur à chaque requête.
export const dynamic = "force-dynamic";

export default async function LiguesPage() {
  const team = await getTeam();
  const customIds = new Set(team.customLeagues.map((l) => l.id));
  const userPoints = {
    gameweekPoints: computeTeamGameweekPoints(team.squad, team.chips),
    totalPoints: team.seasonPoints,
  };

  const leagues: LeagueSummary[] = allLeagues(team)
    .filter((l) => team.joinedLeagueIds.includes(l.id))
    .map((l) => ({
      id: l.id,
      name: l.name,
      code: l.code,
      type: l.type,
      members: l.memberIds.length + 1,
      myRank: userRankInLeague(l, userPoints),
      isCustom: customIds.has(l.id),
    }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Ligues"
        subtitle="Affrontez vos amis dans des ligues privées ou publiques."
      />
      <LeaguesView leagues={leagues} />
    </main>
  );
}
