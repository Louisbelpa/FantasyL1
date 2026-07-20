import type { Player } from "@/types";
import { CLUBS } from "@/lib/constants";
import { formatPrice } from "@/lib/team";
import Jersey from "@/components/ui/Jersey";

/**
 * Carte joueur générique affichée sur le terrain et sur le banc :
 * maillot aux couleurs du club, nom, prix et prochain adversaire.
 * Devient cliquable quand `onClick` est fourni (sélection, échange).
 */
export default function PlayerCard({
  player,
  onClick,
  selected = false,
  eligible = false,
  dimmed = false,
}: {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
  eligible?: boolean;
  dimmed?: boolean;
}) {
  const club = CLUBS[player.club];

  const content = (
    <>
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
    </>
  );

  const stateClasses = `${selected ? "rounded-lg ring-2 ring-accent" : ""} ${
    eligible ? "rounded-lg ring-2 ring-warning" : ""
  } ${dimmed ? "opacity-40" : ""}`;

  if (!onClick) {
    return (
      <div className={`relative flex w-16 flex-col items-center sm:w-20 ${stateClasses}`}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-16 cursor-pointer flex-col items-center transition-transform hover:scale-105 sm:w-20 ${stateClasses}`}
    >
      {content}
    </button>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-background">
      {label}
    </span>
  );
}
