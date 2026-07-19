import type { Player } from "@/types";
import { groupByLine } from "@/lib/team";
import PlayerCard from "@/components/pitch/PlayerCard";

/**
 * Terrain stylisé affichant les titulaires par ligne
 * (gardien en haut, attaquants en bas).
 */
export default function Pitch({ starters }: { starters: Player[] }) {
  const lines = groupByLine(starters);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-edge"
      style={{
        background:
          "repeating-linear-gradient(180deg, var(--color-pitch-dark) 0, var(--color-pitch-dark) 12.5%, var(--color-pitch-light) 12.5%, var(--color-pitch-light) 25%)",
      }}
    >
      {/* Marquages du terrain */}
      <div aria-hidden className="pointer-events-none absolute inset-2 rounded-lg border-2 border-white/20">
        {/* Surface de réparation */}
        <div className="absolute left-1/2 top-0 h-[18%] w-[55%] -translate-x-1/2 border-2 border-t-0 border-white/20" />
        <div className="absolute left-1/2 top-0 h-[8%] w-[28%] -translate-x-1/2 border-2 border-t-0 border-white/20" />
        {/* Rond central sur la ligne médiane (bas) */}
        <div className="absolute -bottom-[9%] left-1/2 aspect-square w-[30%] -translate-x-1/2 rounded-full border-2 border-white/20" />
        <div className="absolute bottom-0 left-0 right-0 border-t-2 border-white/20" />
      </div>

      <div className="relative flex flex-col gap-2 px-2 py-4 sm:gap-4 sm:py-6">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start justify-evenly">
            {line.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
