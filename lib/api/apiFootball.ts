import type {
  ClubCode,
  Gameweek,
  Player,
  PlayerMatchStats,
  Position,
} from "@/types";
import { CLUBS } from "@/lib/constants";

/**
 * Client API-Football (https://www.api-football.com) — Ligue 1 = ligue 61.
 * Module strictement serveur : la clé ne doit jamais atteindre le client.
 *
 * Créez `.env.local` à partir de `.env.local.example` avec votre clé
 * API_FOOTBALL_KEY (plan gratuit : 100 requêtes/jour). Sans clé,
 * l'application fonctionne sur les mocks de `data/`.
 */

const BASE_URL =
  process.env.API_FOOTBALL_BASE ?? "https://v3.football.api-sports.io";
const LEAGUE_ID = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? 61);

export function isApiConfigured(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

/** Saison au sens API-Football : année de départ (2026 pour 2026-27). */
export function apiSeason(): number {
  if (process.env.API_FOOTBALL_SEASON)
    return Number(process.env.API_FOOTBALL_SEASON);
  const now = new Date();
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

/** Noms d'équipe API-Football → nos codes club. */
const API_TEAM_TO_CLUB: Record<string, ClubCode> = {
  "Paris Saint Germain": "PSG",
  Marseille: "OM",
  Lyon: "OL",
  Monaco: "ASM",
  Lille: "LOSC",
  Lens: "RCL",
  Rennes: "SRFC",
  Nice: "OGCN",
  Brest: "SB29",
  Toulouse: "TFC",
  Strasbourg: "RCSA",
  Nantes: "FCN",
  Auxerre: "AJA",
  Angers: "SCO",
  "Le Havre": "HAC",
  Metz: "FCM",
  Lorient: "FCL",
  "Paris FC": "PFC",
};

const API_POSITION: Record<string, Position> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Attacker: "FWD",
};

interface ApiEnvelope<T> {
  errors: Record<string, string> | string[];
  paging: { current: number; total: number };
  response: T[];
}

async function apiFetch<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY manquante (voir .env.local.example).");

  const results: T[] = [];
  let page = 1;
  // Garde-fou : /players pagine par ~20 ; 60 pages couvrent large.
  for (; page <= 60; page++) {
    const url = new URL(path, BASE_URL);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    if (page > 1) url.searchParams.set("page", String(page));

    const res = await fetch(url, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`API-Football HTTP ${res.status} sur ${path}`);
    const body = (await res.json()) as ApiEnvelope<T>;
    const errors = Array.isArray(body.errors)
      ? body.errors
      : Object.values(body.errors ?? {});
    if (errors.length > 0) throw new Error(`API-Football : ${errors.join(" / ")}`);

    results.push(...body.response);
    if (!body.paging || body.paging.current >= body.paging.total) break;
  }
  return results;
}

interface ApiPlayer {
  player: { id: number; name: string; injured: boolean | null };
  statistics: Array<{
    team: { name: string };
    games: {
      position: string | null;
      rating: string | null;
      appearences: number | null;
    };
  }>;
}

interface ApiFixture {
  fixture: { id: number; timestamp: number };
  league: { round: string };
  teams: { home: { name: string }; away: { name: string } };
}

/**
 * Prix fantasy initial : donnée de jeu, pas une donnée fournisseur.
 * Heuristique de départ — base par poste, bonus selon la note moyenne
 * de la saison — à affiner à la main comme le fait FPL.
 */
function derivePrice(position: Position, rating: string | null): number {
  const base: Record<Position, number> = { GK: 4.5, DEF: 4.5, MID: 5.0, FWD: 5.5 };
  const parsed = rating ? Number.parseFloat(rating) : NaN;
  const bonus = Number.isFinite(parsed)
    ? Math.min(5, Math.max(0, (parsed - 6) * 2))
    : 0;
  return Math.round((base[position] + bonus) * 2) / 2;
}

/** "Regular Season - 5" → { id: 5, name: "Journée 5" }. */
function parseRound(round: string): { id: number; name: string } {
  const id = Number(round.match(/(\d+)\s*$/)?.[1] ?? 0);
  return { id, name: id > 0 ? `Journée ${id}` : round };
}

/**
 * Prochaine journée : les prochains matchs, groupés par round ; la
 * deadline est fixée une heure avant le premier coup d'envoi.
 */
export async function fetchNextGameweek(): Promise<{
  gameweek: Gameweek;
  /** Prochain adversaire par club, ex. { PSG: "OM (Dom)" }. */
  opponents: Partial<Record<ClubCode, string>>;
}> {
  const fixtures = await apiFetch<ApiFixture>("/fixtures", {
    league: LEAGUE_ID,
    season: apiSeason(),
    next: 10,
  });
  if (fixtures.length === 0)
    throw new Error("Aucun match à venir renvoyé par l'API.");

  const round = fixtures[0].league.round;
  const roundFixtures = fixtures.filter((f) => f.league.round === round);
  const firstKickoff = Math.min(...roundFixtures.map((f) => f.fixture.timestamp));
  const { id, name } = parseRound(round);

  const opponents: Partial<Record<ClubCode, string>> = {};
  for (const f of roundFixtures) {
    const home = API_TEAM_TO_CLUB[f.teams.home.name];
    const away = API_TEAM_TO_CLUB[f.teams.away.name];
    if (home && away) {
      opponents[home] = `${away} (Dom)`;
      opponents[away] = `${home} (Ext)`;
    }
  }

  return {
    gameweek: {
      id,
      name,
      deadline: new Date((firstKickoff - 3600) * 1000).toISOString(),
    },
    opponents,
  };
}

/**
 * Catalogue complet des joueurs de Ligue 1, mappé vers notre type
 * Player. Les joueurs de clubs non mappés sont ignorés. Les points
 * fantasy démarrent à zéro : ils seront calculés journée par journée
 * par le moteur de points.
 */
export async function fetchCatalogue(
  opponents: Partial<Record<ClubCode, string>>,
): Promise<Player[]> {
  const apiPlayers = await apiFetch<ApiPlayer>("/players", {
    league: LEAGUE_ID,
    season: apiSeason(),
  });

  const players: Player[] = [];
  for (const entry of apiPlayers) {
    const stats = entry.statistics[0];
    if (!stats) continue;
    const club = API_TEAM_TO_CLUB[stats.team.name];
    const position = stats.games.position
      ? API_POSITION[stats.games.position]
      : undefined;
    if (!club || !position || !CLUBS[club]) continue;

    players.push({
      id: entry.player.id,
      name: entry.player.name,
      club,
      position,
      price: derivePrice(position, stats.games.rating),
      totalPoints: 0,
      gameweekPoints: 0,
      nextOpponent: opponents[club] ?? "—",
      status: entry.player.injured ? "injured" : "fit",
      isStarter: false,
    });
  }
  return players;
}

interface ApiFixturePlayers {
  players: Array<{
    player: { id: number };
    statistics: Array<{
      games: { minutes: number | null };
      goals: {
        total: number | null;
        conceded: number | null;
        assists: number | null;
        saves: number | null;
      };
      cards: { yellow: number | null; red: number | null };
      penalty: { missed: number | null; saved: number | null };
    }>;
  }>;
}

/**
 * Stats brutes des joueurs d'un match, prêtes pour scorePlayerGameweek.
 * À appeler après chaque journée pour chaque match du round (l'id des
 * matchs vient de /fixtures?league&season&round=...).
 */
export async function fetchFixturePlayerStats(
  fixtureId: number,
): Promise<PlayerMatchStats[]> {
  const sides = await apiFetch<ApiFixturePlayers>("/fixtures/players", {
    fixture: fixtureId,
  });

  const stats: PlayerMatchStats[] = [];
  for (const side of sides) {
    for (const entry of side.players) {
      const s = entry.statistics[0];
      if (!s) continue;
      const conceded = s.goals.conceded ?? 0;
      stats.push({
        playerId: entry.player.id,
        minutes: s.games.minutes ?? 0,
        goals: s.goals.total ?? 0,
        assists: s.goals.assists ?? 0,
        cleanSheet: conceded === 0,
        goalsConceded: conceded,
        saves: s.goals.saves ?? 0,
        penaltiesSaved: s.penalty.saved ?? 0,
        penaltiesMissed: s.penalty.missed ?? 0,
        yellowCards: s.cards.yellow ?? 0,
        redCards: s.cards.red ?? 0,
        // L'API ne distingue pas les CSC dans ce endpoint : à enrichir
        // via /fixtures/events (type "Goal", detail "Own Goal").
        ownGoals: 0,
      });
    }
  }
  return stats;
}
