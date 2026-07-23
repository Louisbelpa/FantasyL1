import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import SquadBoard from "@/components/pitch/SquadBoard";
import ChipsPanel from "@/components/panel/ChipsPanel";
import DataSyncPanel from "@/components/panel/DataSyncPanel";
import StatsPanel from "@/components/panel/StatsPanel";
import SquadBuilder from "@/components/onboarding/SquadBuilder";
import { activeChip, CHIP_INFO } from "@/lib/chips";
import { managerStats, marketPlayers, players } from "@/lib/data";
import { currentGameweek, isDeadlinePassed } from "@/lib/gameweek";
import { computeTeamGameweekPoints } from "@/lib/scoring";
import { requireUserId } from "@/lib/auth";
import { getGlobal, getTeam } from "@/lib/store";

export const metadata: Metadata = { title: "Mon Équipe" };

// L'équipe est lue depuis le store serveur à chaque requête.
export const dynamic = "force-dynamic";

export default async function Home() {
  const team = await getTeam(await requireUserId());
  const global = await getGlobal();

  if (!team.onboarded) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-6">
        <PageHeader
          title="Créez votre équipe"
          subtitle={`Choisissez 15 joueurs (2 gardiens, 5 défenseurs, 5 milieux, 3 attaquants) avec un budget de 100 M€ — max 3 joueurs par club.`}
        />
        <SquadBuilder pool={global.catalogue ?? [...players, ...marketPlayers]} />
      </main>
    );
  }

  const teamValue =
    Math.round(team.squad.reduce((acc, p) => acc + p.price, 0) * 10) / 10;
  const chip = activeChip(team.chips);
  const gameweek = currentGameweek(global);
  const locked = isDeadlinePassed(gameweek);
  const gameweekPoints = computeTeamGameweekPoints(team.squad, team.chips);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader title="Ma Composition" subtitle={gameweek.name} />

      {/* 65 % / 35 % sur desktop, colonnes empilées sur mobile */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <SquadBoard
          key={team.updatedAt}
          squad={team.squad}
          tripleCaptain={chip === "tripleCaptain"}
          benchBoost={chip === "benchBoost"}
          locked={locked}
        />
        <div className="flex flex-col gap-4">
          <StatsPanel
            stats={{
              ...managerStats,
              teamName: team.teamName,
              gameweekPoints,
              totalPoints: team.seasonPoints,
              bank: team.bank,
              teamValue,
              freeTransfers: team.freeTransfers,
            }}
            gameweek={gameweek}
            activeChipLabel={chip ? CHIP_INFO[chip].label : null}
          />
          <ChipsPanel chips={team.chips} locked={locked} />
          <DataSyncPanel
            dataSource={global.dataSource}
            lastSyncAt={global.lastSyncAt}
            lastSettled={team.gameweekHistory.at(-1) ?? null}
          />
        </div>
      </div>
    </main>
  );
}
