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
  /** Catalogue de joueurs synchronisé depuis l'API (null = mocks). */
  catalogue: Player[] | null;
  /** Journée synchronisée depuis l'API (null = mock). */
  apiGameweek: Gameweek | null;
  dataSource: DataSource;
  lastSyncAt: string | null;
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
    catalogue: null,
    apiGameweek: null,
    dataSource: "mock",
    lastSyncAt: null,
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
