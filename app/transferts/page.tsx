import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import TransfersView from "@/components/transfers/TransfersView";
import { managerStats, marketPlayers, players } from "@/lib/data";

export const metadata: Metadata = { title: "Transferts" };

export default function TransfertsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Transferts"
        subtitle="Vendez un joueur puis achetez son remplaçant au même poste. Max 3 joueurs par club."
      />
      <TransfersView
        initialSquad={players}
        market={marketPlayers}
        initialBank={managerStats.bank}
        freeTransfers={managerStats.freeTransfers}
      />
    </main>
  );
}
