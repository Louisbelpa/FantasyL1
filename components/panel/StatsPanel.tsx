import Link from "next/link";
import type { Gameweek, ManagerStats } from "@/types";
import { formatPrice, formatRank } from "@/lib/team";
import DeadlineCountdown from "@/components/panel/DeadlineCountdown";

export default function StatsPanel({
  stats,
  gameweek,
  activeChipLabel = null,
}: {
  stats: ManagerStats;
  gameweek: Gameweek;
  /** Libellé du jeton bonus actif, le cas échéant. */
  activeChipLabel?: string | null;
}) {
  return (
    <aside className="flex flex-col gap-4">
      {/* Points de la journée */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {stats.teamName}
        </h2>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-4xl font-extrabold text-accent">
              {stats.gameweekPoints}
            </p>
            <p className="text-xs text-muted">Points de la journée</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{stats.totalPoints}</p>
            <p className="text-xs text-muted">Points au total</p>
          </div>
        </div>
      </section>

      {/* Rang et budget */}
      <section className="grid grid-cols-2 gap-3">
        <StatTile label="Rang général" value={formatRank(stats.overallRank)} />
        <StatTile label="Rang journée" value={formatRank(stats.gameweekRank)} />
        <StatTile label="Budget restant" value={formatPrice(stats.bank)} accent />
        <StatTile label="Valeur de l'équipe" value={formatPrice(stats.teamValue)} />
      </section>

      {/* Deadline */}
      <section className="rounded-2xl border border-edge bg-surface p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Deadline — {gameweek.name}
          </h2>
          <span className="text-xs text-muted">
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Paris",
            }).format(new Date(gameweek.deadline))}
          </span>
        </div>
        <DeadlineCountdown deadline={gameweek.deadline} />
        {activeChipLabel ? (
          <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">
            Jeton actif : {activeChipLabel}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted">
          {stats.freeTransfers > 1
            ? `${stats.freeTransfers} transferts gratuits restants avant la deadline.`
            : stats.freeTransfers === 1
              ? "1 transfert gratuit restant avant la deadline."
              : "Aucun transfert gratuit restant avant la deadline."}
        </p>
        <Link
          href="/transferts"
          className="mt-3 block rounded-lg bg-accent py-2.5 text-center text-sm font-bold text-background transition-opacity hover:opacity-90"
        >
          Faire mes transferts
        </Link>
      </section>
    </aside>
  );
}

function StatTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-4">
      <p className={`text-lg font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
