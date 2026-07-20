"use client";

import { useMemo, useState, useTransition } from "react";
import type { Player, Position } from "@/types";
import { saveTransfersAction } from "@/app/actions";
import { CLUBS, POSITION_LABELS, POSITION_SHORT } from "@/lib/constants";
import { formatPrice } from "@/lib/team";
import {
  buyBlockReason,
  computeBank,
  countTransfers,
  swapPlayer,
  transfersPointCost,
} from "@/lib/transfers";
import Jersey from "@/components/ui/Jersey";
import PlayerDetailModal from "@/components/ui/PlayerDetailModal";

const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

type SortKey = "points" | "price-desc" | "price-asc";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function TransfersView({
  initialSquad,
  market,
  initialBank,
  freeTransfers,
  unlimitedChipLabel = null,
  locked = false,
}: {
  initialSquad: Player[];
  market: Player[];
  initialBank: number;
  freeTransfers: number;
  /** Libellé du jeton actif rendant les transferts gratuits (Joker/Free Hit). */
  unlimitedChipLabel?: string | null;
  /** Deadline passée : transferts verrouillés jusqu'à la clôture. */
  locked?: boolean;
}) {
  // Effectif « sauvegardé » : la référence pour compter les transferts.
  const [savedSquad, setSavedSquad] = useState(initialSquad);
  const [squad, setSquad] = useState(initialSquad);
  const [outgoingId, setOutgoingId] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Player | null>(null);
  const [saving, startSaving] = useTransition();

  // Filtres du marché
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  const [clubFilter, setClubFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("points");

  const savedBank = useMemo(
    () => computeBank(initialBank, initialSquad, savedSquad),
    [initialBank, initialSquad, savedSquad],
  );
  const bank = computeBank(savedBank, savedSquad, squad);
  const transfers = countTransfers(savedSquad, squad);
  const pointCost = unlimitedChipLabel
    ? 0
    : transfersPointCost(transfers, freeTransfers);
  const outgoing = squad.find((p) => p.id === outgoingId) ?? null;

  // Pool complet : joueurs du marché + joueurs vendus, moins l'effectif courant.
  const available = useMemo(() => {
    const squadIds = new Set(squad.map((p) => p.id));
    const pool = new Map<number, Player>();
    for (const p of [...market, ...initialSquad, ...savedSquad]) {
      if (!squadIds.has(p.id)) pool.set(p.id, p);
    }
    return [...pool.values()];
  }, [market, initialSquad, savedSquad, squad]);

  const shownPosition = outgoing ? outgoing.position : positionFilter;

  const query = normalize(search.trim());
  const filtered = available
    .filter((p) => (shownPosition ? p.position === shownPosition : true))
    .filter((p) => (clubFilter ? p.club === clubFilter : true))
    .filter((p) => (query ? normalize(p.name).includes(query) : true))
    .sort((a, b) => {
      if (sortKey === "price-asc") return a.price - b.price;
      if (sortKey === "price-desc") return b.price - a.price;
      return b.totalPoints - a.totalPoints;
    });

  function sell(player: Player) {
    if (locked) return;
    setConfirmed(false);
    setOutgoingId((id) => (id === player.id ? null : player.id));
  }

  function buy(player: Player) {
    if (locked || !outgoing || buyBlockReason(squad, bank, outgoing, player)) return;
    setSquad((s) => swapPlayer(s, outgoing, player));
    setOutgoingId(null);
  }

  function reset() {
    setSquad(savedSquad);
    setOutgoingId(null);
    setConfirmed(false);
  }

  function confirm() {
    setServerError(null);
    startSaving(async () => {
      const result = await saveTransfersAction(
        squad.map((p) => ({
          id: p.id,
          isStarter: p.isStarter,
          isCaptain: p.isCaptain ?? false,
          isViceCaptain: p.isViceCaptain ?? false,
        })),
      );
      if (result.ok) {
        setSavedSquad(squad);
        setOutgoingId(null);
        setConfirmed(true);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de synthèse */}
      <section className="sticky top-0 z-30 -mx-4 border-b border-edge bg-background/95 px-4 py-3 backdrop-blur md:top-14 md:mx-0 md:rounded-2xl md:border md:bg-surface">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Summary label="Budget" value={formatPrice(bank)} accent />
          <Summary label="Transferts" value={String(transfers)} />
          <Summary
            label="Coût en points"
            value={
              unlimitedChipLabel ? "Gratuit" : pointCost > 0 ? `-${pointCost} pts` : "0 pt"
            }
            accent={unlimitedChipLabel !== null}
            danger={pointCost > 0}
          />
          <div className="ml-auto flex gap-2">
            <button
              onClick={reset}
              disabled={locked || (transfers === 0 && !outgoing)}
              className="rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-40"
            >
              Réinitialiser
            </button>
            <button
              onClick={confirm}
              disabled={locked || transfers === 0 || saving}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "Enregistrement…" : "Confirmer"}
            </button>
          </div>
        </div>
        {locked ? (
          <p className="mt-2 text-xs font-semibold text-warning">
            Deadline passée — transferts verrouillés jusqu&apos;à la clôture de
            la journée.
          </p>
        ) : null}
        {unlimitedChipLabel ? (
          <p className="mt-2 text-xs font-semibold text-accent">
            {`${unlimitedChipLabel} actif — transferts illimités et gratuits jusqu'à la deadline.`}
          </p>
        ) : null}
        {confirmed ? (
          <p className="mt-2 text-xs font-semibold text-accent">
            Transferts confirmés et sauvegardés ✓
          </p>
        ) : null}
        {serverError ? (
          <p className="mt-2 text-xs font-semibold text-danger">{serverError}</p>
        ) : null}
        {outgoing ? (
          <p className="mt-2 text-xs text-muted">
            Remplacez{" "}
            <span className="font-semibold text-foreground">{outgoing.name}</span>{" "}
            ({POSITION_LABELS[outgoing.position].toLowerCase()}) — budget max{" "}
            <span className="font-semibold text-accent">
              {formatPrice(Math.round((bank + outgoing.price) * 10) / 10)}
            </span>
          </p>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Mon effectif */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Mon effectif
          </h2>
          <div className="flex flex-col gap-4">
            {POSITIONS.map((pos) => (
              <div key={pos} className="overflow-hidden rounded-2xl border border-edge bg-surface">
                <p className="border-b border-edge px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">
                  {POSITION_LABELS[pos]}s
                </p>
                <ul>
                  {squad
                    .filter((p) => p.position === pos)
                    .map((p) => (
                      <PlayerRow
                        key={p.id}
                        player={p}
                        onDetail={() => setDetail(p)}
                        action={
                          <button
                            onClick={() => sell(p)}
                            disabled={locked}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                              outgoingId === p.id
                                ? "bg-danger text-background"
                                : "border border-edge text-muted hover:text-foreground"
                            }`}
                          >
                            {outgoingId === p.id ? "Annuler" : "Vendre"}
                          </button>
                        }
                        highlighted={outgoingId === p.id}
                      />
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Marché */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Marché des transferts
          </h2>

          {/* Filtres */}
          <div className="mb-3 flex flex-col gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un joueur…"
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                <PositionChip
                  label="Tous"
                  active={shownPosition === null}
                  disabled={outgoing !== null}
                  onClick={() => setPositionFilter(null)}
                />
                {POSITIONS.map((pos) => (
                  <PositionChip
                    key={pos}
                    label={POSITION_SHORT[pos]}
                    active={shownPosition === pos}
                    disabled={outgoing !== null}
                    onClick={() => setPositionFilter(pos)}
                  />
                ))}
              </div>
              <select
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
                className="rounded-lg border border-edge bg-surface px-2 py-1.5 text-xs text-muted focus:border-accent focus:outline-none"
              >
                <option value="">Tous les clubs</option>
                {Object.values(CLUBS).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-lg border border-edge bg-surface px-2 py-1.5 text-xs text-muted focus:border-accent focus:outline-none"
              >
                <option value="points">Tri : points</option>
                <option value="price-desc">Tri : prix décroissant</option>
                <option value="price-asc">Tri : prix croissant</option>
              </select>
            </div>
            {outgoing ? (
              <p className="text-xs text-muted">
                Marché filtré sur le poste : {POSITION_LABELS[outgoing.position].toLowerCase()}.
              </p>
            ) : (
              <p className="text-xs text-muted">
                Sélectionnez d&apos;abord un joueur à vendre pour activer l&apos;achat.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">
                Aucun joueur ne correspond aux filtres.
              </p>
            ) : (
              <ul className="max-h-[32rem] overflow-y-auto lg:max-h-[40rem]">
                {filtered.map((p) => {
                  const block = outgoing
                    ? buyBlockReason(squad, bank, outgoing, p)
                    : null;
                  const disabled = locked || !outgoing || block !== null;
                  return (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      showPosition
                      onDetail={() => setDetail(p)}
                      action={
                        <div className="flex flex-col items-end gap-0.5">
                          <button
                            onClick={() => buy(p)}
                            disabled={disabled}
                            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            Acheter
                          </button>
                          {block === "budget" ? (
                            <span className="text-[10px] text-danger">Budget insuffisant</span>
                          ) : null}
                          {block === "club-limit" ? (
                            <span className="text-[10px] text-danger">Max 3 par club</span>
                          ) : null}
                        </div>
                      }
                    />
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
      {detail ? (
        <PlayerDetailModal player={detail} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  );
}

function Summary({
  label,
  value,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-lg font-bold leading-tight ${
          accent ? "text-accent" : danger ? "text-danger" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function PositionChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40 ${
        active ? "bg-accent/15 text-accent" : "border border-edge text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function PlayerRow({
  player,
  action,
  highlighted = false,
  showPosition = false,
  onDetail,
}: {
  player: Player;
  action: React.ReactNode;
  highlighted?: boolean;
  showPosition?: boolean;
  onDetail?: () => void;
}) {
  const club = CLUBS[player.club];
  return (
    <li
      className={`flex items-center gap-3 border-b border-edge px-3 py-2 last:border-b-0 ${
        highlighted ? "bg-danger/10" : ""
      }`}
    >
      <Jersey primary={club.primary} secondary={club.secondary} className="h-7 w-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {onDetail ? (
            <button
              type="button"
              onClick={onDetail}
              className="cursor-pointer hover:text-accent hover:underline"
            >
              {player.name}
            </button>
          ) : (
            player.name
          )}
          {player.status === "injured" ? (
            <span title="Blessé" className="ml-1.5 inline-block h-2 w-2 rounded-full bg-danger" />
          ) : player.status === "doubtful" ? (
            <span title="Incertain" className="ml-1.5 inline-block h-2 w-2 rounded-full bg-warning" />
          ) : null}
        </p>
        <p className="truncate text-[11px] text-muted">
          {club.code}
          {showPosition ? ` · ${POSITION_SHORT[player.position]}` : ""} ·{" "}
          {player.nextOpponent} · {player.totalPoints} pts
        </p>
      </div>
      <p className="shrink-0 text-sm font-bold text-accent">{formatPrice(player.price)}</p>
      <div className="shrink-0">{action}</div>
    </li>
  );
}
