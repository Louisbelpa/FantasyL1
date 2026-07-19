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

- Écran « Ma Composition » : terrain 4-4-2, banc de touche, stats de la journée, compte à rebours de deadline
- Navigation globale (bottom bar mobile / header desktop)
- Données mockées dans `data/players.json` — à remplacer par une API de statistiques sportives
