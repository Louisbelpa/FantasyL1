"use server";

import { revalidatePath } from "next/cache";
import type { Player } from "@/types";
import { marketPlayers, players } from "@/lib/data";
import {
  applyCaptain,
  applySubstitution,
  applyViceCaptain,
  squadInvalidReason,
  substitutionBlockReason,
} from "@/lib/squad";
import { getTeam, saveTeam } from "@/lib/store";
import { computeBank, countTransfers } from "@/lib/transfers";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function mutateSquad(
  mutate: (squad: Player[]) => Player[] | string,
): Promise<ActionResult> {
  const team = await getTeam();
  const result = mutate(team.squad);
  if (typeof result === "string") return { ok: false, error: result };
  const invalid = squadInvalidReason(result);
  if (invalid) return { ok: false, error: invalid };
  await saveTeam({ ...team, squad: result });
  revalidatePath("/");
  revalidatePath("/transferts");
  return { ok: true };
}

export async function substituteAction(aId: number, bId: number): Promise<ActionResult> {
  return mutateSquad((squad) => {
    const reason = substitutionBlockReason(squad, aId, bId);
    return reason ?? applySubstitution(squad, aId, bId);
  });
}

export async function captainAction(id: number): Promise<ActionResult> {
  return mutateSquad((squad) => applyCaptain(squad, id));
}

export async function viceCaptainAction(id: number): Promise<ActionResult> {
  return mutateSquad((squad) => applyViceCaptain(squad, id));
}

/** Rôle d'un joueur dans l'effectif envoyé par le client. */
export interface SquadEntry {
  id: number;
  isStarter: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

/**
 * Confirme des transferts : reconstruit l'effectif à partir du pool
 * de joueurs connu du serveur (les données joueur envoyées par le
 * client ne sont jamais utilisées, seulement les ids et les rôles),
 * puis valide composition, budget et limite par club avant de
 * persister.
 */
export async function saveTransfersAction(entries: SquadEntry[]): Promise<ActionResult> {
  const pool = new Map<number, Player>(
    [...players, ...marketPlayers].map((p) => [p.id, p]),
  );

  const squad: Player[] = [];
  for (const entry of entries) {
    const player = pool.get(entry.id);
    if (!player) return { ok: false, error: `Joueur inconnu (id ${entry.id}).` };
    squad.push({
      ...player,
      isStarter: entry.isStarter,
      isCaptain: entry.isCaptain,
      isViceCaptain: entry.isViceCaptain,
    });
  }
  if (new Set(entries.map((e) => e.id)).size !== entries.length)
    return { ok: false, error: "Effectif invalide : doublons." };

  const invalid = squadInvalidReason(squad);
  if (invalid) return { ok: false, error: invalid };

  const team = await getTeam();
  const bank = computeBank(team.bank, team.squad, squad);
  if (bank < 0) return { ok: false, error: "Budget insuffisant." };

  const transfers = countTransfers(team.squad, squad);
  await saveTeam({
    squad,
    bank,
    freeTransfers: Math.max(0, team.freeTransfers - transfers),
  });
  revalidatePath("/");
  revalidatePath("/transferts");
  return { ok: true };
}
