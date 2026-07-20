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
- Persistance serveur via Server Actions et un store fichier
  (`.store/team.json`, gitignoré) — API async prête pour une vraie base de
  données
- Données mockées dans `data/` — à remplacer par une API de statistiques
  sportives
