import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Pitch from "@/components/pitch/Pitch";
import Bench from "@/components/pitch/Bench";
import StatsPanel from "@/components/panel/StatsPanel";
import { gameweek, managerStats, players } from "@/lib/data";
import { getBench, getFormationLabel, getStarters } from "@/lib/team";

export const metadata: Metadata = { title: "Mon Équipe" };

export default function Home() {
  const starters = getStarters(players);
  const bench = getBench(players);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Ma Composition"
        subtitle={`${gameweek.name} — Formation ${getFormationLabel(starters)}`}
      />

      {/* 65 % / 35 % sur desktop, colonnes empilées sur mobile */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <div>
          <Pitch starters={starters} />
          <Bench players={bench} />
        </div>
        <StatsPanel stats={managerStats} gameweek={gameweek} />
      </div>
    </main>
  );
}
