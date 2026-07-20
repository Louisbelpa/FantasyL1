"use client";

import { useState, useTransition } from "react";
import type { ChipName, Chips } from "@/types";
import { activateChipAction, deactivateChipAction } from "@/app/actions";
import { activeChip, CHIP_INFO, CHIP_NAMES } from "@/lib/chips";

/**
 * Jetons bonus à la FPL : un seul actif par journée, usage unique par
 * saison. Désactiver le Free Hit restaure l'équipe sauvegardée.
 */
export default function ChipsPanel({ chips }: { chips: Chips }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const current = activeChip(chips);

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
        Jetons bonus
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {CHIP_NAMES.map((name) => (
          <ChipRow
            key={name}
            name={name}
            status={chips[name]}
            lockActivation={current !== null}
            disabled={isPending}
            onActivate={() => run(() => activateChipAction(name))}
            onDeactivate={() => run(() => deactivateChipAction(name))}
          />
        ))}
      </ul>
      {error ? (
        <p className="mt-3 text-xs font-semibold text-danger">{error}</p>
      ) : null}
      <p className="mt-3 text-[11px] text-muted">
        Un seul jeton actif par journée, chacun utilisable une fois par saison.
      </p>
    </section>
  );
}

function ChipRow({
  name,
  status,
  lockActivation,
  disabled,
  onActivate,
  onDeactivate,
}: {
  name: ChipName;
  status: Chips[ChipName];
  lockActivation: boolean;
  disabled: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const info = CHIP_INFO[name];
  return (
    <li className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {info.label}
          {status === "active" ? (
            <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
              Actif
            </span>
          ) : null}
          {status === "used" ? (
            <span className="ml-2 rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
              Consommé
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-muted">{info.description}</p>
      </div>
      {status === "available" ? (
        <button
          type="button"
          disabled={disabled || lockActivation}
          onClick={onActivate}
          title={lockActivation ? "Un autre jeton est déjà actif." : undefined}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Activer
        </button>
      ) : null}
      {status === "active" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onDeactivate}
          className="rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-danger disabled:opacity-40"
        >
          {name === "freeHit" ? "Désactiver (restaurer)" : "Désactiver"}
        </button>
      ) : null}
    </li>
  );
}
