import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { CHIP_INFO, CHIP_NAMES } from "@/lib/chips";
import {
  MAX_PER_CLUB,
  SQUAD_COMPOSITION,
  TOTAL_BUDGET,
  TRANSFER_POINT_COST,
} from "@/lib/constants";
import { SCORING } from "@/lib/scoring";
import { FORMATION_LIMITS } from "@/lib/squad";

export const metadata: Metadata = { title: "Règles du jeu" };

const POSITION_NAMES = { GK: "Gardien", DEF: "Défenseur", MID: "Milieu", FWD: "Attaquant" } as const;

export default function ReglesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-6">
      <PageHeader
        title="Règles du jeu"
        subtitle="Composition, transferts, barème de points et jetons bonus."
      />

      <div className="flex flex-col gap-6">
        <Section title="Votre effectif">
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            <li>
              15 joueurs : {SQUAD_COMPOSITION.GK} gardiens, {SQUAD_COMPOSITION.DEF}{" "}
              défenseurs, {SQUAD_COMPOSITION.MID} milieux et {SQUAD_COMPOSITION.FWD}{" "}
              attaquants, pour un budget de {TOTAL_BUDGET} M€.
            </li>
            <li>Maximum {MAX_PER_CLUB} joueurs d&apos;un même club.</li>
            <li>
              11 titulaires alignés chaque journée :{" "}
              {FORMATION_LIMITS.GK.min} gardien, {FORMATION_LIMITS.DEF.min} à{" "}
              {FORMATION_LIMITS.DEF.max} défenseurs, {FORMATION_LIMITS.MID.min} à{" "}
              {FORMATION_LIMITS.MID.max} milieux, {FORMATION_LIMITS.FWD.min} à{" "}
              {FORMATION_LIMITS.FWD.max} attaquants.
            </li>
            <li>
              Le capitaine marque des points doublés ; s&apos;il ne joue pas, le
              vice-capitaine prend le relais.
            </li>
            <li>
              L&apos;équipe est verrouillée entre la deadline (1 h avant le
              premier match) et la fin de la journée.
            </li>
          </ul>
        </Section>

        <Section title="Transferts">
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            <li>1 transfert gratuit par journée, cumulable jusqu&apos;à 5.</li>
            <li>
              Chaque transfert supplémentaire coûte {TRANSFER_POINT_COST} points.
            </li>
            <li>Les échanges se font poste pour poste, dans la limite du budget.</li>
          </ul>
        </Section>

        <Section title="Barème de points">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-semibold">Action</th>
                  <th className="px-3 py-2 text-right font-semibold">Points</th>
                </tr>
              </thead>
              <tbody className="[&_td]:px-3 [&_td]:py-2 [&_tr]:border-b [&_tr]:border-edge last:[&_tr]:border-b-0">
                <Row label="Entrée en jeu (moins de 60 min)" pts={SCORING.appearance} />
                <Row label="60 minutes jouées ou plus" pts={SCORING.fullAppearance} />
                <Row label="But d'un gardien ou défenseur" pts={SCORING.goal.GK} />
                <Row label="But d'un milieu" pts={SCORING.goal.MID} />
                <Row label="But d'un attaquant" pts={SCORING.goal.FWD} />
                <Row label="Passe décisive" pts={SCORING.assist} />
                <Row label="Clean sheet (gardien / défenseur)" pts={SCORING.cleanSheet.GK} />
                <Row label="Clean sheet (milieu)" pts={SCORING.cleanSheet.MID} />
                <Row label={`${SCORING.savesPerPoint} arrêts (gardien)`} pts={1} />
                <Row label="Penalty arrêté" pts={SCORING.penaltySaved} />
                <Row label="Penalty manqué" pts={SCORING.penaltyMissed} />
                <Row
                  label={`${SCORING.goalsConcededPerPenalty} buts encaissés (gardien / défenseur)`}
                  pts={-1}
                />
                <Row label="Carton jaune" pts={SCORING.yellowCard} />
                <Row label="Carton rouge" pts={SCORING.redCard} />
                <Row label="But contre son camp" pts={SCORING.ownGoal} />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Jetons bonus">
          <ul className="space-y-2 text-sm">
            {CHIP_NAMES.map((name) => (
              <li key={name}>
                <span className="font-semibold">{CHIP_INFO[name].label}</span>{" "}
                <span className="text-muted">— {CHIP_INFO[name].description}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Un seul jeton actif par journée ; chaque jeton est utilisable une
            fois par saison et consommé à la clôture de la journée.
          </p>
        </Section>

        <Section title="Postes">
          <p className="text-sm text-muted">
            {Object.entries(POSITION_NAMES)
              .map(([code, label]) => `${code} = ${label}`)
              .join(" · ")}
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, pts }: { label: string; pts: number }) {
  return (
    <tr>
      <td className="text-muted">{label}</td>
      <td className={`text-right font-bold tabular-nums ${pts < 0 ? "text-danger" : "text-accent"}`}>
        {pts > 0 ? `+${pts}` : pts}
      </td>
    </tr>
  );
}
