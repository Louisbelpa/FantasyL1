import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import TransfersView from "@/components/transfers/TransfersView";
import { marketPlayers, players } from "@/lib/data";
import { getTeam } from "@/lib/store";

export const metadata: Metadata = { title: "Transferts" };

// L'équipe est lue depuis le store serveur à chaque requête.
export const dynamic = "force-dynamic";

export default async function TransfertsPage() {
  const team = await getTeam();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Transferts"
        subtitle="Vendez un joueur puis achetez son remplaçant au même poste. Max 3 joueurs par club."
      />
      <TransfersView
        initialSquad={team.squad}
        market={[...players, ...marketPlayers]}
        initialBank={team.bank}
        freeTransfers={team.freeTransfers}
      />
    </main>
  );
}
