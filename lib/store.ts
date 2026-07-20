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
 * Persistance côté serveur de l'équipe du manager. En attendant une
 * vraie base de données, l'état vit dans un fichier JSON sur disque
 * (`.store/team.json`, gitignoré), seedé depuis les mocks au premier
 * accès. Toute l'API est asynchrone pour qu'un passage à une base de
 * données ne change pas les signatures.
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

const STORE_FILE = path.join(process.cwd(), ".store", "team.json");

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

export async function getTeam(): Promise<TeamState> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<TeamState>;
    // Les champs ajoutés après coup sont rétro-remplis depuis le seed ;
    // un store existant (équipe déjà en place) est réputé onboardé.
    return { ...seed(), onboarded: Boolean(parsed.squad), ...parsed };
  } catch {
    // Premier accès (ou fichier corrompu) : repartir du seed mock.
    const state = seed();
    await saveTeam(state);
    return state;
  }
}

export async function saveTeam(state: Omit<TeamState, "updatedAt">): Promise<TeamState> {
  const next: TeamState = { ...state, updatedAt: new Date().toISOString() };
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  // Écriture atomique : jamais de fichier à moitié écrit.
  const tmp = `${STORE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, STORE_FILE);
  return next;
}
