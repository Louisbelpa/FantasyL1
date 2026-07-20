import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import SquadBoard from "@/components/pitch/SquadBoard";
import StatsPanel from "@/components/panel/StatsPanel";
import { gameweek, managerStats } from "@/lib/data";
import { getTeam } from "@/lib/store";

export const metadata: Metadata = { title: "Mon Équipe" };

// L'équipe est lue depuis le store serveur à chaque requête.
export const dynamic = "force-dynamic";

export default async function Home() {
  const team = await getTeam();
  const teamValue =
    Math.round(team.squad.reduce((acc, p) => acc + p.price, 0) * 10) / 10;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader title="Ma Composition" subtitle={gameweek.name} />

      {/* 65 % / 35 % sur desktop, colonnes empilées sur mobile */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <SquadBoard key={team.updatedAt} squad={team.squad} />
        <StatsPanel
          stats={{
            ...managerStats,
            bank: team.bank,
            teamValue,
            freeTransfers: team.freeTransfers,
          }}
          gameweek={gameweek}
        />
      </div>
    </main>
  );
}
