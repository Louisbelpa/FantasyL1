"use client";

import { useState, useTransition } from "react";
import type { Player } from "@/types";
import { captainAction, substituteAction, viceCaptainAction } from "@/app/actions";
import { POSITION_LABELS } from "@/lib/constants";
import {
  applyCaptain,
  applySubstitution,
  applyViceCaptain,
  substitutionBlockReason,
} from "@/lib/squad";
import { getBench, getFormationLabel, getStarters } from "@/lib/team";
import Pitch from "@/components/pitch/Pitch";
import Bench from "@/components/pitch/Bench";

/**
 * Terrain interactif : sélection d'un joueur, brassards de capitaine
 * et vice-capitaine, remplacements titulaire ↔ banc. Les changements
 * sont appliqués immédiatement (optimiste) puis persistés via Server
 * Actions ; en cas d'erreur serveur, l'état est restauré.
 */
export default function SquadBoard({
  squad: serverSquad,
  tripleCaptain = false,
  benchBoost = false,
  locked = false,
}: {
  squad: Player[];
  tripleCaptain?: boolean;
  benchBoost?: boolean;
  /** Deadline passée : équipe verrouillée jusqu'à la clôture. */
  locked?: boolean;
}) {
  const [squad, setSquad] = useState(serverSquad);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const starters = getStarters(squad);
  const bench = getBench(squad);
  const selected = squad.find((p) => p.id === selectedId) ?? null;

  const eligibleIds =
    swapMode && selected
      ? new Set(
          squad
            .filter((p) => substitutionBlockReason(squad, selected.id, p.id) === null)
            .map((p) => p.id),
        )
      : undefined;

  function runAction(
    optimistic: Player[],
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    const previous = squad;
    setSquad(optimistic);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setSquad(previous);
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  }

  function deselect() {
    setSelectedId(null);
    setSwapMode(false);
    setError(null);
  }

  function handlePlayerClick(player: Player) {
    if (swapMode && selected) {
      if (player.id === selected.id) {
        setSwapMode(false);
        return;
      }
      const reason = substitutionBlockReason(squad, selected.id, player.id);
      if (reason) {
        setError(reason);
        return;
      }
      const a = selected.id;
      runAction(applySubstitution(squad, a, player.id), () =>
        substituteAction(a, player.id),
      );
      setSelectedId(null);
      setSwapMode(false);
      return;
    }
    setError(null);
    setSelectedId((id) => (id === player.id ? null : player.id));
  }

  function makeCaptain() {
    if (!selected) return;
    runAction(applyCaptain(squad, selected.id), () => captainAction(selected.id));
    deselect();
  }

  function makeViceCaptain() {
    if (!selected) return;
    runAction(applyViceCaptain(squad, selected.id), () =>
      viceCaptainAction(selected.id),
    );
    deselect();
  }

  return (
    <div>
      {/* Barre d'action */}
      <div className="mb-3 min-h-11 rounded-xl border border-edge bg-surface px-3 py-2">
        {locked ? (
          <p className="py-1 text-xs font-semibold text-warning">
            Deadline passée — équipe verrouillée jusqu&apos;à la clôture de la
            journée.
            <span className="ml-2 font-normal text-muted">
              Formation {getFormationLabel(starters)}
            </span>
          </p>
        ) : selected ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm">
              <span className="font-semibold">{selected.name}</span>{" "}
              <span className="text-xs text-muted">
                · {POSITION_LABELS[selected.position]}
                {selected.isStarter ? "" : " · remplaçant"}
              </span>
            </p>
            {swapMode ? (
              <>
                <p className="text-xs text-muted">
                  Choisissez un joueur en surbrillance pour l&apos;échange.
                </p>
                <ActionButton label="Annuler" onClick={() => setSwapMode(false)} />
              </>
            ) : (
              <>
                {selected.isStarter && !selected.isCaptain ? (
                  <ActionButton label="Capitaine" onClick={makeCaptain} />
                ) : null}
                {selected.isStarter && !selected.isViceCaptain ? (
                  <ActionButton label="Vice-capitaine" onClick={makeViceCaptain} />
                ) : null}
                <ActionButton
                  label="Remplacer"
                  primary
                  onClick={() => setSwapMode(true)}
                />
                <ActionButton label="Fermer" onClick={deselect} />
              </>
            )}
          </div>
        ) : (
          <p className="py-1 text-xs text-muted">
            Touchez un joueur pour changer le capitaine ou faire un remplacement.
            <span className="ml-2 font-semibold text-foreground">
              Formation {getFormationLabel(starters)}
            </span>
            {isPending ? <span className="ml-2 text-accent">Enregistrement…</span> : null}
          </p>
        )}
        {error ? <p className="mt-1 text-xs font-semibold text-danger">{error}</p> : null}
      </div>

      <Pitch
        starters={starters}
        onPlayerClick={locked ? undefined : handlePlayerClick}
        selectedId={selectedId}
        eligibleIds={eligibleIds}
        swapMode={swapMode}
        tripleCaptain={tripleCaptain}
      />
      <Bench
        players={bench}
        onPlayerClick={locked ? undefined : handlePlayerClick}
        selectedId={selectedId}
        eligibleIds={eligibleIds}
        swapMode={swapMode}
        boosted={benchBoost}
      />
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        primary
          ? "bg-accent font-bold text-background hover:opacity-90"
          : "border border-edge text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
