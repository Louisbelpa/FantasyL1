"use client";

import { useState, useTransition } from "react";
import type { ChipName, DataSource } from "@/types";
import { settleGameweekAction, syncFromApiAction } from "@/app/actions";
import { CHIP_INFO } from "@/lib/chips";

export interface LastSettled {
  name: string;
  points: number;
  chip: ChipName | null;
}

/**
 * Source des données (mock ou API-Football), synchronisation manuelle
 * et clôture de la journée en cours (simulée sans clé API).
 */
export default function DataSyncPanel({
  dataSource,
  lastSyncAt,
  lastSettled,
}: {
  dataSource: DataSource;
  lastSyncAt: string | null;
  lastSettled: LastSettled | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Une erreur est survenue.");
    });
  }

  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Données &amp; journée
      </h2>
      <p className="mt-1 text-xs text-muted">
        Source :{" "}
        <span
          className={`font-semibold ${
            dataSource === "api" ? "text-accent" : "text-warning"
          }`}
        >
          {dataSource === "api" ? "API-Football (Ligue 1)" : "Mock local"}
        </span>
        {lastSyncAt ? (
          <>
            {" · dernière sync : "}
            {new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Paris",
            }).format(new Date(lastSyncAt))}
          </>
        ) : null}
      </p>
      {lastSettled ? (
        <p className="mt-1 text-xs text-muted">
          {`${lastSettled.name} créditée : `}
          <span className="font-semibold text-accent">{lastSettled.points} pts</span>
          {lastSettled.chip
            ? ` · jeton ${CHIP_INFO[lastSettled.chip].label} consommé`
            : ""}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run(syncFromApiAction)}
          disabled={isPending}
          className="rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent disabled:opacity-40"
        >
          {isPending ? "En cours…" : "Synchroniser"}
        </button>
        <button
          type="button"
          onClick={() => run(settleGameweekAction)}
          disabled={isPending}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {dataSource === "api" ? "Clôturer la journée" : "Clôturer la journée (simulation)"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs font-semibold text-danger">{error}</p>
      ) : null}
    </section>
  );
}
