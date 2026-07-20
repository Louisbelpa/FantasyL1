import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import RankingTable from "@/components/rankings/RankingTable";
import { findLeagueById, leagueTable } from "@/lib/leagues";
import { computeTeamGameweekPoints } from "@/lib/scoring";
import { requireUserId } from "@/lib/auth";
import { getTeam } from "@/lib/store";

export const metadata: Metadata = { title: "Classement de ligue" };

export const dynamic = "force-dynamic";

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getTeam(await requireUserId());
  const league = findLeagueById(team, id);
  if (!league) notFound();

  const isMember = team.joinedLeagueIds.includes(league.id);
  const rows = leagueTable(league, isMember, {
    gameweekPoints: computeTeamGameweekPoints(team.squad, team.chips),
    totalPoints: team.seasonPoints,
    teamName: team.teamName,
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-6">
      <Link href="/ligues" className="text-xs text-muted hover:text-accent">
        ← Retour aux ligues
      </Link>
      <div className="mt-2">
        <PageHeader
          title={league.name}
          subtitle={`Ligue ${league.type} · ${rows.length} manager${rows.length > 1 ? "s" : ""} · code d'invitation : ${league.code}`}
        />
      </div>
      <RankingTable rows={rows} />
      {!isMember ? (
        <p className="mt-4 text-center text-xs text-muted">
          Vous n&apos;êtes pas membre de cette ligue — rejoignez-la avec le code{" "}
          <span className="font-mono font-semibold text-foreground">{league.code}</span>.
        </p>
      ) : null}
    </main>
  );
}
