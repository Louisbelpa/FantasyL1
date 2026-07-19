import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Classements" };

export default function ClassementsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Classements"
        subtitle="Suivez votre progression au classement général et par journée."
      />
      <div className="rounded-xl border border-edge bg-surface p-8 text-center">
        <p className="text-muted">
          Le classement général, le classement par journée et les ligues suivies
          s&apos;afficheront ici.
        </p>
      </div>
    </main>
  );
}
