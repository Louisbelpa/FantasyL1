import type { Player } from "@/types";
import { POSITION_SHORT } from "@/lib/constants";
import PlayerCard from "@/components/pitch/PlayerCard";

export default function Bench({ players }: { players: Player[] }) {
  return (
    <section className="mt-4 rounded-2xl border border-edge bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Banc de touche
      </h2>
      <div className="flex justify-evenly gap-2 overflow-x-auto">
        {players.map((player) => (
          <div key={player.id} className="flex flex-col items-center gap-1.5">
            <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[9px] font-bold text-muted">
              {POSITION_SHORT[player.position]}
            </span>
            <PlayerCard player={player} />
          </div>
        ))}
      </div>
    </section>
  );
}
