"use client";

import { useState, useTransition } from "react";
import type { DataSource } from "@/types";
import { syncFromApiAction } from "@/app/actions";

/**
 * Source des données (mock ou API-Football) et déclenchement manuel
 * de la synchronisation. Sans clé configurée, l'action renvoie la
 * marche à suivre.
 */
export default function DataSyncPanel({
  dataSource,
  lastSyncAt,
}: {
  dataSource: DataSource;
  lastSyncAt: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function sync() {
    setError(null);
    startTransition(async () => {
      const result = await syncFromApiAction();
      if (!result.ok) setError(result.error ?? "Une erreur est survenue.");
    });
  }

  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Données
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
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={isPending}
          className="shrink-0 rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent disabled:opacity-40"
        >
          {isPending ? "Synchronisation…" : "Synchroniser"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs font-semibold text-danger">{error}</p>
      ) : null}
    </section>
  );
}
