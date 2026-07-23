import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { CHIP_INFO } from "@/lib/chips";
import { requireUserId } from "@/lib/auth";
import { getTeam } from "@/lib/store";

export const metadata: Metadata = { title: "Historique" };

export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const team = await getTeam(await requireUserId());
  const history = [...team.gameweekHistory].reverse();
  const best = team.gameweekHistory.reduce(
    (max, entry) => Math.max(max, entry.points),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-6">
      <Link href="/equipe" className="text-xs text-muted hover:text-accent">
        ← Retour à Mon Équipe
      </Link>
      <div className="mt-2">
        <PageHeader
          title="Ma saison"
          subtitle={`${team.teamName} — ${team.seasonPoints} points en ${team.gameweekHistory.length} journée${team.gameweekHistory.length > 1 ? "s" : ""}.`}
        />
      </div>

      {history.length === 0 ? (
        <p className="rounded-2xl border border-edge bg-surface p-8 text-center text-sm text-muted">
          Aucune journée clôturée pour l&apos;instant. Vos points apparaîtront
          ici après chaque journée.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-semibold">Journée</th>
                <th className="px-3 py-2 font-semibold">Jeton</th>
                <th className="w-20 px-3 py-2 text-right font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-edge last:border-b-0"
                >
                  <td className="px-3 py-2.5 font-semibold">
                    {entry.name}
                    {entry.points === best && best > 0 ? (
                      <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                        Record
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">
                    {entry.chip ? CHIP_INFO[entry.chip].label : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums text-accent">
                    {entry.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
