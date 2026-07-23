import { promises as fs } from "fs";
import path from "path";
import type {
  ChipName,
  Chips,
  DataSource,
  Gameweek,
  League,
  Player,
} from "@/types";
import { defaultChips } from "@/lib/chips";
import { managerStats, players } from "@/lib/data";

/**
 * Persistance côté serveur de l'équipe de chaque manager, seedée
 * depuis les mocks au premier accès. Deux backends derrière la même
 * API : Postgres via Drizzle quand DATABASE_URL est configurée (Neon
 * en production), sinon un fichier JSON par manager dans `.store/`
 * (gitignoré) pour le dev local.
 */
export interface TeamState {
  /** Faux tant que le manager n'a pas créé son équipe (onboarding). */
  onboarded: boolean;
  teamName: string;
  squad: Player[];
  /** Banque restante en millions d'euros. */
  bank: number;
  freeTransfers: number;
  /** Ids des ligues (mock ou créées) dont le manager est membre. */
  joinedLeagueIds: string[];
  /** Ligues créées par le manager. */
  customLeagues: League[];
  /** Jetons bonus (disponible / actif / consommé). */
  chips: Chips;
  /** Équipe sauvegardée à l'activation du Free Hit, restaurée ensuite. */
  freeHitSnapshot: { squad: Player[]; bank: number } | null;
  /** Points crédités sur la saison (journées clôturées). */
  seasonPoints: number;
  /** Journées clôturées, de la plus ancienne à la plus récente. */
  gameweekHistory: Array<{
    id: number;
    name: string;
    points: number;
    chip: ChipName | null;
  }>;
  updatedAt: string;
}

const STORE_DIR = path.join(process.cwd(), ".store");

function databaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function fileFor(userId: string): string {
  // Compatibilité avec le store historique du mode mono-utilisateur.
  if (userId === "local-dev") return path.join(STORE_DIR, "team.json");
  return path.join(STORE_DIR, `team-${userId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function seed(): TeamState {
  return {
    onboarded: false,
    teamName: managerStats.teamName,
    squad: players,
    bank: managerStats.bank,
    freeTransfers: managerStats.freeTransfers,
    joinedLeagueIds: ["ligue-potos", "ligue-generale"],
    customLeagues: [],
    chips: defaultChips(),
    freeHitSnapshot: null,
    seasonPoints: managerStats.totalPoints,
    gameweekHistory: [
      {
        id: 1,
        name: "Journée 1",
        points: managerStats.totalPoints,
        chip: null,
      },
    ],
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * Rétro-remplissage : les champs ajoutés après coup viennent du seed ;
 * un état existant (équipe déjà en place) est réputé onboardé.
 */
function hydrate(parsed: Partial<TeamState>): TeamState {
  return { ...seed(), onboarded: Boolean(parsed.squad), ...parsed };
}

export async function getTeam(userId: string): Promise<TeamState> {
  if (databaseEnabled()) {
    const { dbGetTeam } = await import("@/lib/db");
    const existing = await dbGetTeam(userId);
    if (existing) return hydrate(existing);
    return saveTeam(userId, seed());
  }

  try {
    const raw = await fs.readFile(fileFor(userId), "utf8");
    return hydrate(JSON.parse(raw) as Partial<TeamState>);
  } catch {
    // Premier accès (ou fichier corrompu) : repartir du seed mock.
    return saveTeam(userId, seed());
  }
}

export async function saveTeam(
  userId: string,
  state: Omit<TeamState, "updatedAt">,
): Promise<TeamState> {
  const next: TeamState = { ...state, updatedAt: new Date().toISOString() };

  if (databaseEnabled()) {
    const { dbSaveTeam } = await import("@/lib/db");
    await dbSaveTeam(userId, next);
    return next;
  }

  const file = fileFor(userId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Écriture atomique : jamais de fichier à moitié écrit.
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, file);
  return next;
}

/**
 * État global partagé par tous les managers : catalogue de joueurs et
 * journée en cours, synchronisés une seule fois pour tout le monde
 * (une copie par manager ne passerait pas à l'échelle, ni en stockage
 * ni en quota API).
 */
export interface GlobalState {
  /** Catalogue synchronisé depuis l'API (null = mocks). */
  catalogue: Player[] | null;
  /** Journée en cours synchronisée ou avancée par clôture (null = mock). */
  gameweek: Gameweek | null;
  dataSource: DataSource;
  lastSyncAt: string | null;
  updatedAt: string;
}

const GLOBAL_FILE = path.join(STORE_DIR, "global.json");

function seedGlobal(): GlobalState {
  return {
    catalogue: null,
    gameweek: null,
    dataSource: "mock",
    lastSyncAt: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export async function getGlobal(): Promise<GlobalState> {
  if (databaseEnabled()) {
    const { dbGetGlobal } = await import("@/lib/db");
    const existing = await dbGetGlobal();
    if (existing) return { ...seedGlobal(), ...existing };
    return saveGlobal(seedGlobal());
  }
  try {
    const raw = await fs.readFile(GLOBAL_FILE, "utf8");
    return { ...seedGlobal(), ...(JSON.parse(raw) as Partial<GlobalState>) };
  } catch {
    return saveGlobal(seedGlobal());
  }
}

export async function saveGlobal(
  state: Omit<GlobalState, "updatedAt">,
): Promise<GlobalState> {
  const next: GlobalState = { ...state, updatedAt: new Date().toISOString() };
  if (databaseEnabled()) {
    const { dbSaveGlobal } = await import("@/lib/db");
    await dbSaveGlobal(next);
    return next;
  }
  await fs.mkdir(STORE_DIR, { recursive: true });
  const tmp = `${GLOBAL_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, GLOBAL_FILE);
  return next;
}

/** Ids de tous les managers connus (pour le cron de clôture). */
export async function listUserIds(): Promise<string[]> {
  if (databaseEnabled()) {
    const { dbListUserIds } = await import("@/lib/db");
    return dbListUserIds();
  }
  try {
    const files = await fs.readdir(STORE_DIR);
    return files
      .filter((f) => f === "team.json" || (f.startsWith("team-") && f.endsWith(".json")))
      .map((f) =>
        f === "team.json" ? "local-dev" : f.replace(/^team-/, "").replace(/\.json$/, ""),
      );
  } catch {
    return [];
  }
}
