import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Transferts" };

export default function TransfertsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Transferts"
        subtitle="Achetez et vendez des joueurs pour améliorer votre équipe."
      />
      <div className="rounded-xl border border-edge bg-surface p-8 text-center">
        <p className="text-muted">
          Le marché des transferts arrive bientôt. Vous pourrez y filtrer les
          joueurs de Ligue 1 par poste, prix et forme.
        </p>
      </div>
    </main>
  );
}
