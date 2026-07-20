# Fantasy Ligue 1

MVP d'une application web de Fantasy Football dédiée à la Ligue 1, inspirée de la Fantasy Premier League.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- TailwindCSS v4
- Thème « Sombre & Néon » : fond `#0B0F19`, texte `#F4F6F9`, accent `#00E676`
- Approche mobile-first (Bottom Navigation Bar sur mobile)

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Données réelles (API-Football)

Par défaut l'application tourne sur les mocks de `data/`. Pour brancher les
vraies données Ligue 1 :

1. Créer une clé gratuite (100 req/jour) sur
   [dashboard.api-football.com](https://dashboard.api-football.com)
2. `cp .env.local.example .env.local` puis renseigner `API_FOOTBALL_KEY`
3. Redémarrer le serveur et cliquer **Synchroniser** dans le panneau
   « Données » de la page Mon Équipe

La synchronisation importe le catalogue des joueurs de Ligue 1 (~500) et la
prochaine journée (deadline = 1 h avant le premier coup d'envoi) dans le
store. Le marché des transferts bascule alors sur les vrais joueurs —
activez le Joker pour reconstruire votre équipe sans limite. Les points
fantasy sont calculés par `lib/scoring.ts` (barème FPL) à partir des stats
brutes de `lib/api/apiFootball.ts` (`fetchFixturePlayerStats`) ; les prix
restent une donnée de jeu générée par une heuristique à affiner.

## Comptes & base de données (production)

Sans configuration, l'app tourne en mode mono-utilisateur avec persistance
fichier (`.store/`). Pour le multi-utilisateurs :

1. **Auth Clerk** : créer une application sur
   [dashboard.clerk.com](https://dashboard.clerk.com) et renseigner
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` dans `.env.local`.
   La connexion devient obligatoire (`/connexion`), chaque utilisateur a sa
   propre équipe.
2. **Postgres Neon** : créer une base sur [neon.tech](https://neon.tech) et
   renseigner `DATABASE_URL`. Le store bascule sur Postgres (Drizzle, table
   `fantasy_teams` créée automatiquement au premier accès — un état JSONB par
   manager ; le modèle relationnel fin viendra avec les ligues multi-joueurs).

Les deux options sont indépendantes : chacune s'active par la simple présence
de ses variables d'environnement.

## Structure

```
app/          Pages (App Router) : Mon Équipe, Transferts, Ligues, Classements
components/   Composants UI (navigation, terrain, cartes joueur, panneaux)
lib/          Helpers métier (formation, formatage, sélection titulaires/banc)
types/        Types TypeScript partagés (Player, Gameweek, …)
data/         Données mock (15 joueurs fictifs) en attendant l'API de stats
```

## État du MVP

- Écran « Ma Composition » : terrain interactif (capitaine, vice-capitaine,
  remplacements avec règles de formation), banc de touche, stats, compte à
  rebours de deadline
- Transferts : marché filtrable, budget, max 3 joueurs par club, coût en
  points au-delà du transfert gratuit
- Ligues : rejoindre par code d'invitation, créer une ligue privée (code
  généré), classement par ligue
- Classements : général et par journée, tendance ▲▼, équipe de l'utilisateur
  épinglée
- Jetons bonus à la FPL : Triple Capitaine, Bench Boost, Joker (transferts
  illimités), Free Hit (équipe restaurée) — un seul actif par journée, usage
  unique par saison
- Clôture de journée : points des joueurs calculés par le moteur (barème
  FPL), points d'équipe crédités (capitaine ×2/×3, banc sous Bench Boost),
  jeton actif consommé, +1 transfert gratuit (plafond 5), passage à la
  journée suivante — stats réelles en mode API, simulées en mode mock
- Onboarding : création d'équipe (nom + 15 joueurs dans le budget, règles
  appliquées en direct)
- Verrouillage à la deadline (serveur + UI) jusqu'à la clôture
- Fiche joueur (points par journée) et page /historique (ma saison)
- Page /regles (barème généré depuis le moteur), écrans erreur/404/chargement
- Persistance serveur via Server Actions et un store fichier
  (`.store/team.json`, gitignoré) — API async prête pour une vraie base de
  données
- Données mockées dans `data/` — à remplacer par une API de statistiques
  sportives
