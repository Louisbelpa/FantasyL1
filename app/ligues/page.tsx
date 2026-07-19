import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Ligues" };

export default function LiguesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Ligues"
        subtitle="Affrontez vos amis dans des ligues privées ou publiques."
      />
      <div className="rounded-xl border border-edge bg-surface p-8 text-center">
        <p className="text-muted">
          Créez ou rejoignez une ligue avec un code d&apos;invitation. Cette
          fonctionnalité arrive bientôt.
        </p>
      </div>
    </main>
  );
}
