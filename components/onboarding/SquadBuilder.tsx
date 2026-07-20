"use client";

import { useState, useTransition } from "react";
import type { Player, Position } from "@/types";
import { createTeamAction } from "@/app/actions";
import {
  CLUBS,
  MAX_PER_CLUB,
  POSITION_SHORT,
  SQUAD_COMPOSITION,
  TOTAL_BUDGET,
} from "@/lib/constants";
import { formatPrice } from "@/lib/team";
import Jersey from "@/components/ui/Jersey";

const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Onboarding : choix du nom d'équipe et de 15 joueurs dans le budget.
 * Les rôles (titulaires 4-4-2, capitaine) sont assignés côté serveur
 * et ajustables ensuite sur le terrain.
 */
export default function SquadBuilder({ pool }: { pool: Player[] }) {
  const [teamName, setTeamName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = pool.filter((p) => selectedIds.has(p.id));
  const cost = Math.round(selected.reduce((acc, p) => acc + p.price, 0) * 10) / 10;
  const remaining = Math.round((TOTAL_BUDGET - cost) * 10) / 10;
  const countByPos = (pos: Position) =>
    selected.filter((p) => p.position === pos).length;
  const complete =
    POSITIONS.every((pos) => countByPos(pos) === SQUAD_COMPOSITION[pos]) &&
    remaining >= 0;

  function toggle(player: Player) {
    setError(null);
    setSelectedIds((ids) => {
      const next = new Set(ids);
      if (next.has(player.id)) {
        next.delete(player.id);
        return next;
      }
      if (countByPos(player.position) >= SQUAD_COMPOSITION[player.position]) {
        setError(
          `Vous avez déjà ${SQUAD_COMPOSITION[player.position]} joueur(s) à ce poste.`,
        );
        return ids;
      }
      if (selected.filter((p) => p.club === player.club).length >= MAX_PER_CLUB) {
        setError(`Maximum ${MAX_PER_CLUB} joueurs du même club.`);
        return ids;
      }
      next.add(player.id);
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createTeamAction(teamName, [...selectedIds]);
      if (!result.ok) setError(result.error ?? "Une erreur est survenue.");
    });
  }

  const query = normalize(search.trim());
  const shown = pool
    .filter((p) => (positionFilter ? p.position === positionFilter : true))
    .filter((p) => (query ? normalize(p.name).includes(query) : true))
    .sort((a, b) => b.price - a.price);

  return (
    <div className="flex flex-col gap-4">
      {/* Synthèse sticky */}
      <section className="sticky top-0 z-30 -mx-4 border-b border-edge bg-background/95 px-4 py-3 backdrop-blur md:top-14 md:mx-0 md:rounded-2xl md:border md:bg-surface">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div>
            <p className={`text-lg font-bold ${remaining < 0 ? "text-danger" : "text-accent"}`}>
              {formatPrice(remaining)}
            </p>
            <p className="text-[11px] text-muted">Budget restant</p>
          </div>
          {POSITIONS.map((pos) => (
            <div key={pos}>
              <p
                className={`text-lg font-bold tabular-nums ${
                  countByPos(pos) === SQUAD_COMPOSITION[pos] ? "text-accent" : ""
                }`}
              >
                {countByPos(pos)}/{SQUAD_COMPOSITION[pos]}
              </p>
              <p className="text-[11px] text-muted">{POSITION_SHORT[pos]}</p>
            </div>
          ))}
          <button
            type="button"
            onClick={submit}
            disabled={!complete || teamName.trim().length < 3 || isPending}
            className="ml-auto rounded-lg bg-accent px-4 py-2 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? "Création…" : "Valider mon équipe"}
          </button>
        </div>
        {error ? (
          <p className="mt-2 text-xs font-semibold text-danger">{error}</p>
        ) : null}
      </section>

      <input
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="Nom de votre équipe (3 à 30 caractères)"
        maxLength={30}
        className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm font-semibold placeholder:font-normal placeholder:text-muted focus:border-accent focus:outline-none"
      />

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <FilterChip
            label="Tous"
            active={positionFilter === null}
            onClick={() => setPositionFilter(null)}
          />
          {POSITIONS.map((pos) => (
            <FilterChip
              key={pos}
              label={POSITION_SHORT[pos]}
              active={positionFilter === pos}
              onClick={() => setPositionFilter(pos)}
            />
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="min-w-0 flex-1 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {/* Liste des joueurs */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
        <ul className="max-h-[30rem] overflow-y-auto">
          {shown.map((p) => {
            const isSelected = selectedIds.has(p.id);
            const club = CLUBS[p.club];
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 border-b border-edge px-3 py-2 last:border-b-0 ${
                  isSelected ? "bg-accent/10" : ""
                }`}
              >
                <Jersey primary={club.primary} secondary={club.secondary} className="h-7 w-7 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-[11px] text-muted">
                    {club.code} · {POSITION_SHORT[p.position]} · {p.nextOpponent}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-accent">
                  {formatPrice(p.price)}
                </p>
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-danger/80 text-background"
                      : "bg-accent text-background hover:opacity-90"
                  }`}
                >
                  {isSelected ? "Retirer" : "Ajouter"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-accent/15 text-accent" : "border border-edge text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
