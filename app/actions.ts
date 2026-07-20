"use server";

import { revalidatePath } from "next/cache";
import type { ChipName, League, Player } from "@/types";
import { fetchCatalogue, fetchNextGameweek, isApiConfigured } from "@/lib/api/apiFootball";
import { requireUserId } from "@/lib/auth";
import { activeChip, CHIP_INFO, transfersUnlimited } from "@/lib/chips";
import { marketPlayers, players } from "@/lib/data";
import { currentGameweek, isDeadlinePassed } from "@/lib/gameweek";
import { findLeagueByCode, findLeagueById } from "@/lib/leagues";
import { runSettlement } from "@/lib/settle-run";
import { TOTAL_BUDGET } from "@/lib/constants";
import { defaultChips } from "@/lib/chips";
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

/** Équipe verrouillée entre la deadline et la clôture de la journée. */
function deadlineBlock(team: Awaited<ReturnType<typeof getTeam>>): ActionResult | null {
  const gameweek = currentGameweek(team);
  if (isDeadlinePassed(gameweek))
    return {
      ok: false,
      error: `Deadline de la ${gameweek.name} passée : équipe verrouillée jusqu'à la clôture de la journée.`,
    };
  return null;
}

async function mutateSquad(
  mutate: (squad: Player[]) => Player[] | string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const team = await getTeam(userId);
  const blocked = deadlineBlock(team);
  if (blocked) return blocked;
  const result = mutate(team.squad);
  if (typeof result === "string") return { ok: false, error: result };
  const invalid = squadInvalidReason(result);
  if (invalid) return { ok: false, error: invalid };
  await saveTeam(userId, { ...team, squad: result });
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

/**
 * Active un jeton bonus. Règles FPL : chaque jeton est à usage unique
 * sur la saison et un seul jeton peut être actif par journée. Le Free
 * Hit sauvegarde l'équipe courante pour pouvoir la restaurer.
 */
export async function activateChipAction(chip: ChipName): Promise<ActionResult> {
  if (!CHIP_INFO[chip]) return { ok: false, error: "Jeton inconnu." };

  const userId = await requireUserId();
  const team = await getTeam(userId);
  const blocked = deadlineBlock(team);
  if (blocked) return blocked;
  if (team.chips[chip] === "used")
    return { ok: false, error: `« ${CHIP_INFO[chip].label} » a déjà été consommé cette saison.` };
  if (team.chips[chip] === "active")
    return { ok: false, error: `« ${CHIP_INFO[chip].label} » est déjà actif.` };
  const current = activeChip(team.chips);
  if (current)
    return {
      ok: false,
      error: `Un seul jeton par journée : « ${CHIP_INFO[current].label} » est déjà actif.`,
    };

  await saveTeam(userId, {
    ...team,
    chips: { ...team.chips, [chip]: "active" },
    freeHitSnapshot:
      chip === "freeHit"
        ? { squad: team.squad, bank: team.bank }
        : team.freeHitSnapshot,
  });
  revalidatePath("/");
  revalidatePath("/transferts");
  return { ok: true };
}

/**
 * Désactive un jeton avant la deadline. Désactiver le Free Hit
 * restaure l'équipe et la banque sauvegardées à l'activation.
 */
export async function deactivateChipAction(chip: ChipName): Promise<ActionResult> {
  if (!CHIP_INFO[chip]) return { ok: false, error: "Jeton inconnu." };

  const userId = await requireUserId();
  const team = await getTeam(userId);
  const blocked = deadlineBlock(team);
  if (blocked) return blocked;
  if (team.chips[chip] !== "active")
    return { ok: false, error: `« ${CHIP_INFO[chip].label} » n'est pas actif.` };

  const restore = chip === "freeHit" ? team.freeHitSnapshot : null;
  await saveTeam(userId, {
    ...team,
    squad: restore ? restore.squad : team.squad,
    bank: restore ? restore.bank : team.bank,
    chips: { ...team.chips, [chip]: "available" },
    freeHitSnapshot: chip === "freeHit" ? null : team.freeHitSnapshot,
  });
  revalidatePath("/");
  revalidatePath("/transferts");
  return { ok: true };
}

/**
 * Synchronise catalogue de joueurs et journée depuis API-Football vers
 * le store. Les joueurs de l'effectif présents dans le catalogue sont
 * rafraîchis (statut, adversaire) en conservant leurs rôles et leur
 * prix d'achat ; les autres (mocks) restent tels quels — activez le
 * Joker pour reconstruire l'équipe avec les vrais joueurs.
 */
export async function syncFromApiAction(): Promise<ActionResult> {
  if (!isApiConfigured())
    return {
      ok: false,
      error:
        "Clé API absente. Copiez .env.local.example vers .env.local, renseignez API_FOOTBALL_KEY (gratuit sur api-football.com), puis redémarrez le serveur.",
    };

  try {
    const { gameweek, opponents } = await fetchNextGameweek();
    const catalogue = await fetchCatalogue(opponents);
    if (catalogue.length === 0)
      return {
        ok: false,
        error:
          "Synchronisation vide : vérifiez la saison (API_FOOTBALL_SEASON) et le mapping des clubs.",
      };

    const userId = await requireUserId();
    const team = await getTeam(userId);
    const byId = new Map(catalogue.map((p) => [p.id, p]));
    const squad = team.squad.map((p) => {
      const fresh = byId.get(p.id);
      return fresh
        ? {
            ...fresh,
            price: p.price,
            isStarter: p.isStarter,
            isCaptain: p.isCaptain,
            isViceCaptain: p.isViceCaptain,
          }
        : p;
    });

    await saveTeam(userId, {
      ...team,
      squad,
      catalogue,
      apiGameweek: gameweek,
      dataSource: "api",
      lastSyncAt: new Date().toISOString(),
    });
    revalidatePath("/");
    revalidatePath("/transferts");
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error: `Échec de la synchronisation : ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    };
  }
}

/**
 * Onboarding : crée l'équipe du manager à partir de 15 joueurs choisis
 * dans le pool serveur. Les rôles sont assignés automatiquement en
 * 4-4-2 (les plus chers de chaque ligne titulaires, capitaine = joueur
 * le plus cher) — ajustables ensuite sur le terrain. Remet la saison à
 * zéro : banque, jetons, points, historique.
 */
export async function createTeamAction(
  name: string,
  ids: number[],
): Promise<ActionResult> {
  const teamName = name.trim();
  if (teamName.length < 3 || teamName.length > 30)
    return { ok: false, error: "Le nom d'équipe doit faire entre 3 et 30 caractères." };

  const userId = await requireUserId();
  const team = await getTeam(userId);
  const pool = new Map<number, Player>(
    (team.catalogue ?? [...players, ...marketPlayers]).map((p) => [p.id, p]),
  );

  const picked: Player[] = [];
  for (const id of new Set(ids)) {
    const player = pool.get(id);
    if (!player) return { ok: false, error: `Joueur inconnu (id ${id}).` };
    picked.push({ ...player, isStarter: false, isCaptain: false, isViceCaptain: false });
  }

  // Rôles automatiques : 4-4-2 avec les plus chers de chaque ligne.
  const byLine = (pos: Player["position"]) =>
    picked.filter((p) => p.position === pos).sort((a, b) => b.price - a.price);
  const starters = [
    ...byLine("GK").slice(0, 1),
    ...byLine("DEF").slice(0, 4),
    ...byLine("MID").slice(0, 4),
    ...byLine("FWD").slice(0, 2),
  ];
  const starterIds = new Set(starters.map((p) => p.id));
  const captains = [...starters].sort((a, b) => b.price - a.price);
  const squad = picked.map((p) => ({
    ...p,
    isStarter: starterIds.has(p.id),
    isCaptain: p.id === captains[0]?.id,
    isViceCaptain: p.id === captains[1]?.id,
  }));

  const invalid = squadInvalidReason(squad);
  if (invalid) return { ok: false, error: invalid };
  const cost = Math.round(squad.reduce((acc, p) => acc + p.price, 0) * 10) / 10;
  if (cost > TOTAL_BUDGET)
    return { ok: false, error: `Budget dépassé : ${cost} M€ pour ${TOTAL_BUDGET} M€.` };

  await saveTeam(userId, {
    ...team,
    onboarded: true,
    teamName,
    squad,
    bank: Math.round((TOTAL_BUDGET - cost) * 10) / 10,
    freeTransfers: 1,
    chips: defaultChips(),
    freeHitSnapshot: null,
    seasonPoints: 0,
    gameweekHistory: [],
  });
  revalidatePath("/");
  revalidatePath("/transferts");
  revalidatePath("/classements");
  revalidatePath("/ligues");
  return { ok: true };
}

/**
 * Clôture la journée en cours : points des joueurs via le moteur de
 * scoring, points d'équipe (capitaine, jetons), jeton actif consommé,
 * équipe restaurée après un Free Hit, +1 transfert gratuit, passage à
 * la journée suivante. En mode API les stats viennent des matchs réels
 * (journée terminée exigée) ; en mode mock elles sont simulées.
 */
export async function settleGameweekAction(): Promise<ActionResult> {
  const userId = await requireUserId();
  return runSettlement(userId);
}

/** Rejoint une ligue via son code d'invitation. */
export async function joinLeagueAction(code: string): Promise<ActionResult> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Saisissez un code d'invitation." };

  const userId = await requireUserId();
  const team = await getTeam(userId);
  const league = findLeagueByCode(team, trimmed);
  if (!league) return { ok: false, error: "Aucune ligue ne correspond à ce code." };
  if (team.joinedLeagueIds.includes(league.id))
    return { ok: false, error: `Vous êtes déjà membre de « ${league.name} ».` };

  await saveTeam(userId, { ...team, joinedLeagueIds: [...team.joinedLeagueIds, league.id] });
  revalidatePath("/ligues");
  return { ok: true };
}

/** Crée une ligue privée et en devient membre. */
export async function createLeagueAction(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 40)
    return { ok: false, error: "Le nom doit faire entre 3 et 40 caractères." };

  const userId = await requireUserId();
  const team = await getTeam(userId);
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
  await saveTeam(userId, {
    ...team,
    customLeagues: [...team.customLeagues, league],
    joinedLeagueIds: [...team.joinedLeagueIds, league.id],
  });
  revalidatePath("/ligues");
  return { ok: true };
}

/** Quitte une ligue (une ligue créée par le manager est supprimée). */
export async function leaveLeagueAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const team = await getTeam(userId);
  const league = findLeagueById(team, id);
  if (!league || !team.joinedLeagueIds.includes(id))
    return { ok: false, error: "Vous n'êtes pas membre de cette ligue." };

  await saveTeam(userId, {
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
  const userId = await requireUserId();
  const team = await getTeam(userId);
  const blocked = deadlineBlock(team);
  if (blocked) return blocked;
  const pool = new Map<number, Player>(
    [...players, ...marketPlayers, ...(team.catalogue ?? [])].map((p) => [p.id, p]),
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

  const bank = computeBank(team.bank, team.squad, squad);
  if (bank < 0) return { ok: false, error: "Budget insuffisant." };

  // Joker ou Free Hit actif : les transferts sont gratuits et illimités,
  // le compteur de transferts gratuits n'est pas entamé.
  const transfers = countTransfers(team.squad, squad);
  await saveTeam(userId, {
    ...team,
    squad,
    bank,
    freeTransfers: transfersUnlimited(team.chips)
      ? team.freeTransfers
      : Math.max(0, team.freeTransfers - transfers),
  });
  revalidatePath("/");
  revalidatePath("/transferts");
  return { ok: true };
}
