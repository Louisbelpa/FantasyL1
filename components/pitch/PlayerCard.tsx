import type { Player } from "@/types";
import { CLUBS } from "@/lib/constants";
import { formatPrice } from "@/lib/team";

/**
 * Carte joueur générique affichée sur le terrain et sur le banc :
 * maillot aux couleurs du club, nom, prix et prochain adversaire.
 */
export default function PlayerCard({ player }: { player: Player }) {
  const club = CLUBS[player.club];

  return (
    <div className="relative flex w-16 flex-col items-center sm:w-20">
      {player.isCaptain ? <Badge label="C" /> : null}
      {player.isViceCaptain ? <Badge label="V" /> : null}
      {player.status !== "fit" ? (
        <span
          title={player.status === "injured" ? "Blessé" : "Incertain"}
          className={`absolute -left-1 top-0 z-10 h-2.5 w-2.5 rounded-full ${
            player.status === "injured" ? "bg-danger" : "bg-warning"
          }`}
        />
      ) : null}

      <Jersey primary={club.primary} secondary={club.secondary} />

      <div className="mt-1 w-full overflow-hidden rounded-md text-center text-[10px] leading-tight sm:text-[11px]">
        <p className="truncate bg-surface-raised px-1 py-0.5 font-semibold">
          {player.name.split(" ").at(-1)}
        </p>
        <p className="flex items-center justify-center gap-1 bg-surface px-1 py-0.5 text-muted">
          <span className="text-accent">{formatPrice(player.price)}</span>
        </p>
        <p className="truncate bg-surface px-1 pb-0.5 text-[9px] text-muted sm:text-[10px]">
          {player.nextOpponent}
        </p>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-background">
      {label}
    </span>
  );
}

function Jersey({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <svg viewBox="0 0 24 22" className="h-9 w-9 drop-shadow sm:h-11 sm:w-11" aria-hidden>
      {/* Manches */}
      <path d="M7 2 1.5 5 4 9.5 7 8Z" fill={secondary} stroke="#0b0f19" strokeWidth="0.6" />
      <path d="M17 2 22.5 5 20 9.5 17 8Z" fill={secondary} stroke="#0b0f19" strokeWidth="0.6" />
      {/* Corps */}
      <path
        d="M7 2h3a2 2 0 0 0 4 0h3v18H7Z"
        fill={primary}
        stroke="#0b0f19"
        strokeWidth="0.6"
      />
    </svg>
  );
}
