"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createLeagueAction, joinLeagueAction, leaveLeagueAction } from "@/app/actions";

export interface LeagueSummary {
  id: string;
  name: string;
  code: string;
  type: string;
  /** Nombre de managers, utilisateur inclus. */
  members: number;
  myRank: number;
  isCustom: boolean;
}

export default function LeaguesView({ leagues }: { leagues: LeagueSummary[] }) {
  const [joinCode, setJoinCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onOk?.();
      else setError(result.error ?? "Une erreur est survenue.");
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* Mes ligues */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Mes ligues
        </h2>
        {leagues.length === 0 ? (
          <p className="rounded-2xl border border-edge bg-surface p-6 text-center text-sm text-muted">
            Vous n&apos;êtes membre d&apos;aucune ligue. Rejoignez-en une avec un
            code, ou créez la vôtre.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {leagues.map((league) => (
              <li
                key={league.id}
                className="flex items-center gap-3 rounded-2xl border border-edge bg-surface p-4"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/ligues/${league.id}`}
                    className="truncate font-semibold hover:text-accent"
                  >
                    {league.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    Ligue {league.type} · {league.members} manager
                    {league.members > 1 ? "s" : ""} · code{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {league.code}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-accent">{league.myRank}
                    <span className="text-xs font-normal text-muted">
                      /{league.members}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted">Mon rang</p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    run(
                      () => leaveLeagueAction(league.id),
                      () =>
                        setNotice(
                          league.isCustom
                            ? `Ligue « ${league.name} » supprimée.`
                            : `Vous avez quitté « ${league.name} ».`,
                        ),
                    )
                  }
                  className="rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-danger disabled:opacity-40"
                >
                  {league.isCustom ? "Supprimer" : "Quitter"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {notice ? (
          <p className="mt-3 text-xs font-semibold text-accent">{notice}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-xs font-semibold text-danger">{error}</p>
        ) : null}
      </section>

      {/* Rejoindre / créer */}
      <section className="flex flex-col gap-4">
        <form
          className="rounded-2xl border border-edge bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => joinLeagueAction(joinCode),
              () => {
                setNotice("Ligue rejointe ✓");
                setJoinCode("");
              },
            );
          }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Rejoindre une ligue
          </h2>
          <p className="mt-1 text-xs text-muted">
            Saisissez le code d&apos;invitation partagé par le créateur de la ligue.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ex. BUREAU7"
              className="min-w-0 flex-1 rounded-lg border border-edge bg-surface-raised px-3 py-2 font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending || !joinCode.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Rejoindre
            </button>
          </div>
        </form>

        <form
          className="rounded-2xl border border-edge bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => createLeagueAction(createName),
              () => {
                setNotice(
                  "Ligue créée ✓ — partagez son code d'invitation pour recruter.",
                );
                setCreateName("");
              },
            );
          }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Créer une ligue privée
          </h2>
          <p className="mt-1 text-xs text-muted">
            Un code d&apos;invitation unique sera généré automatiquement.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Nom de la ligue"
              className="min-w-0 flex-1 rounded-lg border border-edge bg-surface-raised px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending || createName.trim().length < 3}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Créer
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
