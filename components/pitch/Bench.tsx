import type { Player } from "@/types";
import { POSITION_SHORT } from "@/lib/constants";
import PlayerCard from "@/components/pitch/PlayerCard";
import type { PitchInteraction } from "@/components/pitch/Pitch";

export default function Bench({
  players,
  onPlayerClick,
  selectedId,
  eligibleIds,
  swapMode = false,
  boosted = false,
}: { players: Player[]; boosted?: boolean } & PitchInteraction) {
  return (
    <section
      className={`mt-4 rounded-2xl border bg-surface p-4 ${
        boosted ? "border-accent/60" : "border-edge"
      }`}
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Banc de touche
        {boosted ? (
          <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
            Bench Boost actif — ces points comptent
          </span>
        ) : null}
      </h2>
      <div className="flex justify-evenly gap-2 overflow-x-auto">
        {players.map((player) => (
          <div key={player.id} className="flex flex-col items-center gap-1.5">
            <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[9px] font-bold text-muted">
              {POSITION_SHORT[player.position]}
            </span>
            <PlayerCard
              player={player}
              onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
              selected={player.id === selectedId}
              eligible={eligibleIds?.has(player.id) ?? false}
              dimmed={
                swapMode && player.id !== selectedId && !eligibleIds?.has(player.id)
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
