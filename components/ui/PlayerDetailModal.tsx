"use client";

import type { Player } from "@/types";
import { CLUBS, POSITION_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/team";
import Jersey from "@/components/ui/Jersey";

/** Fiche joueur : infos, statut, prochain match, points par journée. */
export default function PlayerDetailModal({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const club = CLUBS[player.club];
  const history = [...(player.pointsHistory ?? [])].reverse();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={`Fiche de ${player.name}`}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-edge bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <Jersey primary={club.primary} secondary={club.secondary} className="h-14 w-14 drop-shadow" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{player.name}</h2>
            <p className="text-sm text-muted">
              {club.name} · {POSITION_LABELS[player.position]}
            </p>
            {player.status !== "fit" ? (
              <p
                className={`mt-1 text-xs font-semibold ${
                  player.status === "injured" ? "text-danger" : "text-warning"
                }`}
              >
                {player.status === "injured" ? "Blessé" : "Incertain"}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg border border-edge px-2.5 py-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Prix" value={formatPrice(player.price)} />
          <Stat label="Total saison" value={`${player.totalPoints} pts`} />
          <Stat label="Prochain match" value={player.nextOpponent} />
        </div>

        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
          Points par journée
        </h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Aucune journée clôturée pour ce joueur.
          </p>
        ) : (
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-edge">
            {history.map((entry) => (
              <li
                key={entry.gameweek}
                className="flex items-center justify-between border-b border-edge px-3 py-2 text-sm last:border-b-0"
              >
                <span className="text-muted">Journée {entry.gameweek}</span>
                <span
                  className={`font-bold tabular-nums ${
                    entry.points > 0 ? "text-accent" : entry.points < 0 ? "text-danger" : "text-muted"
                  }`}
                >
                  {entry.points} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-raised px-2 py-2.5">
      <p className="truncate text-sm font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted">{label}</p>
    </div>
  );
}
