"use client";

import { useState } from "react";
import RankingTable, { type RankingTableRow } from "@/components/rankings/RankingTable";

/**
 * Classements globaux avec deux onglets : général (points totaux,
 * tendance vs journée précédente) et journée en cours. L'utilisateur,
 * hors du top affiché, est épinglé en bas du tableau.
 */
export default function RankingsView({
  general,
  gameweekRows,
  pinnedGeneral,
  pinnedGameweek,
}: {
  general: RankingTableRow[];
  gameweekRows: RankingTableRow[];
  pinnedGeneral: RankingTableRow;
  pinnedGameweek: RankingTableRow;
}) {
  const [tab, setTab] = useState<"general" | "gameweek">("general");

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-xl border border-edge bg-surface p-1">
        <TabButton
          label="Classement général"
          active={tab === "general"}
          onClick={() => setTab("general")}
        />
        <TabButton
          label="Journée en cours"
          active={tab === "gameweek"}
          onClick={() => setTab("gameweek")}
        />
      </div>
      {tab === "general" ? (
        <RankingTable rows={general} pinnedRow={pinnedGeneral} />
      ) : (
        <RankingTable rows={gameweekRows} pinnedRow={pinnedGameweek} />
      )}
      <p className="mt-3 text-xs text-muted">
        Top 20 mondial (données mock). Votre équipe est épinglée en bas du tableau.
      </p>
    </div>
  );
}

function TabButton({
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
      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
        active ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
