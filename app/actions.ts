"use server";

import { revalidatePath } from "next/cache";
import type { League, Player } from "@/types";
import { marketPlayers, players } from "@/lib/data";
import { findLeagueByCode, findLeagueById } from "@/lib/leagues";
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

/** Rejoint une ligue via son code d'invitation. */
export async function joinLeagueAction(code: string): Promise<ActionResult> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Saisissez un code d'invitation." };

  const team = await getTeam();
  const league = findLeagueByCode(team, trimmed);
  if (!league) return { ok: false, error: "Aucune ligue ne correspond à ce code." };
  if (team.joinedLeagueIds.includes(league.id))
    return { ok: false, error: `Vous êtes déjà membre de « ${league.name} ».` };

  await saveTeam({ ...team, joinedLeagueIds: [...team.joinedLeagueIds, league.id] });
  revalidatePath("/ligues");
  return { ok: true };
}

/** Crée une ligue privée et en devient membre. */
export async function createLeagueAction(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 40)
    return { ok: false, error: "Le nom doit faire entre 3 et 40 caractères." };

  const team = await getTeam();
  const exists = team.customLeagues.some(
    (l) => l.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exists) return { ok: false, error: "Vous avez déjà une ligue à ce nom." };

  // Code d'invitation lisible : 6 caractères sans ambiguïté (pas de O/0, I/1).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do {
    code = Array.from(
      { length: 6 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  } while (findLeagueByCode(team, code));

  const league: League = {
    id: `perso-${Date.now().toString(36)}`,
    name: trimmed,
    code,
    type: "privée",
    memberIds: [],
  };
  await saveTeam({
    ...team,
    customLeagues: [...team.customLeagues, league],
    joinedLeagueIds: [...team.joinedLeagueIds, league.id],
  });
  revalidatePath("/ligues");
  return { ok: true };
}

/** Quitte une ligue (une ligue créée par le manager est supprimée). */
export async function leaveLeagueAction(id: string): Promise<ActionResult> {
  const team = await getTeam();
  const league = findLeagueById(team, id);
  if (!league || !team.joinedLeagueIds.includes(id))
    return { ok: false, error: "Vous n'êtes pas membre de cette ligue." };

  await saveTeam({
    ...team,
    joinedLeagueIds: team.joinedLeagueIds.filter((l) => l !== id),
    customLeagues: team.customLeagues.filter((l) => l.id !== id),
  });
  revalidatePath("/ligues");
  return { ok: true };
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
    ...team,
    squad,
    bank,
    freeTransfers: Math.max(0, team.freeTransfers - transfers),
  });
  revalidatePath("/");
  revalidatePath("/transferts");
  return { ok: true };
}
