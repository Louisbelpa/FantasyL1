import type { RankingRow } from "@/lib/leagues";

export interface RankingTableRow extends RankingRow {
  /** Places gagnées (+) ou perdues (−) depuis la journée précédente. */
  movement?: number;
  /** Rang affiché tel quel (ex. rang mondial de l'utilisateur). */
  rankLabel?: string;
}

/**
 * Tableau de classement générique (ligues et classements globaux).
 * `pinnedRow` est affichée après une ligne de séparation — utilisée
 * pour montrer l'utilisateur hors du top affiché.
 */
export default function RankingTable({
  rows,
  pinnedRow,
}: {
  rows: RankingTableRow[];
  pinnedRow?: RankingTableRow;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="w-20 px-3 py-2 font-semibold">Rang</th>
            <th className="px-3 py-2 font-semibold">Équipe</th>
            <th className="w-16 px-3 py-2 text-right font-semibold">Journée</th>
            <th className="w-16 px-3 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row key={`${row.rank}-${row.teamName}`} row={row} />
          ))}
          {pinnedRow ? (
            <>
              <tr aria-hidden>
                <td colSpan={4} className="px-3 py-1 text-center text-muted">
                  …
                </td>
              </tr>
              <Row row={pinnedRow} />
            </>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row }: { row: RankingTableRow }) {
  return (
    <tr
      className={`border-b border-edge last:border-b-0 ${
        row.isUser ? "bg-accent/10" : ""
      }`}
    >
      <td className="px-3 py-2.5">
        <span className="flex items-center gap-1.5 tabular-nums">
          {row.rankLabel ?? row.rank}
          <Movement value={row.movement} />
        </span>
      </td>
      <td className="px-3 py-2.5">
        <p className={`truncate font-semibold ${row.isUser ? "text-accent" : ""}`}>
          {row.teamName}
        </p>
        <p className="truncate text-xs text-muted">{row.managerName}</p>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-muted">
        {row.gameweekPoints}
      </td>
      <td className="px-3 py-2.5 text-right font-bold tabular-nums">
        {row.totalPoints}
      </td>
    </tr>
  );
}

function Movement({ value }: { value?: number }) {
  if (value === undefined) return null;
  const formatted = Math.abs(value).toLocaleString("fr-FR");
  if (value > 0) return <span className="text-xs text-accent">▲{formatted}</span>;
  if (value < 0) return <span className="text-xs text-danger">▼{formatted}</span>;
  return <span className="text-xs text-muted">—</span>;
}
