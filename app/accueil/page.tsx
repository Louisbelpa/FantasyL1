import type { Metadata } from "next";
import Link from "next/link";
import LandingCountdown from "@/components/landing/LandingCountdown";
import { currentGameweek } from "@/lib/gameweek";
import { getGlobal } from "@/lib/store";

export const metadata: Metadata = {
  title: "Fantasy Ligue 1 — Ton onze. Leur défaite.",
  description:
    "100 M€, 15 joueurs, une deadline avant chaque journée de Ligue 1. Composez votre équipe fantasy et affrontez vos amis.",
};

// Lit la journée en cours (état partagé) pour la deadline en direct.
export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const gameweek = currentGameweek(await getGlobal());
  const deadline = gameweek.deadline;
  const gw = gameweek.id;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* LIVE TICKER */}
      <div className="overflow-hidden whitespace-nowrap border-b border-edge bg-scoreboard">
        <div className="inline-flex animate-ticker py-2 font-mono text-[11.5px]">
          <TickerRun gw={gw} deadline={deadline} />
          <TickerRun gw={gw} deadline={deadline} />
        </div>
      </div>

      {/* MASTHEAD */}
      <header className="mx-auto flex max-w-[1180px] items-end justify-between border-b-2 border-accent px-6 py-5">
        <Link
          href="/accueil"
          className="text-[22px] font-black uppercase leading-none tracking-tight"
        >
          Fantasy<span className="text-accent">L1</span>
        </Link>
        <nav className="flex items-end gap-7 font-mono text-xs uppercase tracking-[0.06em] text-muted">
          <Link href="/regles" className="hover:text-foreground">
            Règles
          </Link>
          <Link href="/connexion" className="hover:text-foreground">
            Connexion
          </Link>
          <span>
            J.
            <span className="text-[15px] font-bold text-foreground">{gw}</span>
          </span>
        </nav>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-[1180px] grid-cols-1 md:grid-cols-[1fr_320px]">
        <div className="border-b border-edge px-6 py-12 md:border-b-0 md:border-r md:py-14 md:pl-0 md:pr-10">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.1em] text-accent">
            Saison 2026/27 — inscriptions ouvertes
          </p>
          <h1 className="mb-7 text-[clamp(38px,5.4vw,68px)] font-black uppercase leading-[0.98] tracking-[-0.035em]">
            Ton onze.
            <br />
            <span style={{ WebkitTextStroke: "1.5px #00E676", color: "transparent" }}>
              Leur défaite.
            </span>
          </h1>
          <p className="mb-8 max-w-[420px] text-base leading-relaxed text-muted">
            100 M€, 15 joueurs, une deadline avant chaque journée de Ligue 1.
            Pas de round bonus offert, pas de seconde chance.
          </p>
          <div className="flex items-stretch">
            <Link
              href="/"
              className="flex items-center gap-2 bg-accent px-6 py-4 text-[13.5px] font-extrabold uppercase tracking-[0.04em] text-background transition-opacity hover:opacity-90"
            >
              Créer mon équipe <span aria-hidden>→</span>
            </Link>
            <Link
              href="/regles"
              className="border border-l-0 border-edge px-6 py-4 text-[13.5px] font-bold uppercase tracking-[0.04em] text-foreground transition-colors hover:bg-surface"
            >
              Barème
            </Link>
          </div>
        </div>

        {/* Scoreboard block */}
        <aside className="md:border-l md:border-edge">
          <div className="flex items-center justify-between border-b-2 border-accent bg-scoreboard px-5 py-[18px]">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              Mon équipe
            </span>
            <span className="h-1.5 w-1.5 bg-accent" />
          </div>
          <ScoreRow label="Points J.13" value="63" accent />
          <ScoreRow label="Rang général" value="12 456e" />
          <ScoreRow label="Budget restant" value="2.4M€" />
          <div className="flex items-baseline justify-between px-5 py-5">
            <span className="font-mono text-[11px] uppercase text-warning">
              Deadline
            </span>
            <LandingCountdown
              deadline={deadline}
              className="font-mono text-[28px] font-bold text-warning"
            />
          </div>
        </aside>
      </section>

      {/* FEUILLE DE MATCH */}
      <section className="mx-auto max-w-[1180px] border-t border-edge px-6 py-20">
        <p className="mb-12 font-mono text-xs uppercase tracking-[0.1em] text-accent">
          Feuille de match — ce qui compte
        </p>
        <Feature
          index="01"
          title="Le capitaine compte double."
          body="Un choix par journée qui peut renverser un classement. Aucune sécurité, aucun remboursement de points si tu te trompes."
        />
        <Feature
          index="02"
          title="Quatre jetons. Une seule fois chacun."
          body="Triple Capitaine, Bench Boost, Joker, Free Hit — chacun utilisable une fois dans la saison. Le timing est la vraie compétence."
          reversed
        />
        <Feature
          index="03"
          title="La deadline ne négocie pas."
          body="Ton onze se fige au coup d'envoi du premier match de la journée. Après, tu regardes — comme tout le monde."
        />
        <Feature
          index="04"
          title="Le vrai classement est entre potes."
          body="Crée une ligue privée ou rejoins-en une par code. Le général, c'est pour la forme."
          reversed
          last
        />
      </section>

      {/* FINAL CTA */}
      <section className="border-t-[3px] border-accent bg-scoreboard">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-6 py-14">
          <div>
            <p className="mb-2 text-[26px] font-black uppercase tracking-[-0.02em]">
              Deadline J.{gw} dans{" "}
              <LandingCountdown deadline={deadline} className="font-mono text-accent" />
            </p>
            <p className="text-sm text-muted">Après ça, ton équipe est figée.</p>
          </div>
          <Link
            href="/"
            className="bg-accent px-8 py-4 text-[13.5px] font-extrabold uppercase tracking-[0.04em] text-background transition-opacity hover:opacity-90"
          >
            Créer mon équipe →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-[11.5px] uppercase tracking-[0.04em] text-muted">
        <span>
          FantasyL1 — jeu non officiel, sans lien avec les clubs ou la Ligue.
        </span>
        <span className="flex gap-5">
          <Link href="/regles" className="hover:text-foreground">
            Règles
          </Link>
          <Link href="/regles" className="hover:text-foreground">
            Confidentialité
          </Link>
        </span>
      </footer>
    </div>
  );
}

function TickerRun({ gw, deadline }: { gw: number; deadline: string }) {
  const sep = <span className="px-[22px] text-edge">/</span>;
  return (
    <>
      <span className="px-[22px] text-muted">
        STADE BRÉA <span className="text-accent">2</span>–
        <span className="text-foreground">1</span> AC FERRA
      </span>
      {sep}
      <span className="px-[22px] text-muted">
        DEADLINE J.{gw}{" "}
        <LandingCountdown deadline={deadline} className="text-warning" />
      </span>
      {sep}
      <span className="px-[22px] text-muted">
        OLYMPIA FC <span className="text-accent">3</span>–
        <span className="text-foreground">0</span> US LYRA
      </span>
      {sep}
      <span className="px-[22px] text-muted">142 318 ÉQUIPES ENGAGÉES</span>
      {sep}
    </>
  );
}

function ScoreRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-edge px-5 py-5">
      <span className="font-mono text-[11px] uppercase text-muted">{label}</span>
      <span
        className={`font-mono text-[28px] font-bold ${accent ? "text-accent" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function Feature({
  index,
  title,
  body,
  reversed = false,
  last = false,
}: {
  index: string;
  title: string;
  body: string;
  reversed?: boolean;
  last?: boolean;
}) {
  const number = (
    <div
      className={`text-[56px] font-black leading-none text-edge ${
        reversed ? "md:text-right" : ""
      }`}
    >
      {index}
    </div>
  );
  const text = (
    <div className={`max-w-[640px] ${reversed ? "md:ml-auto md:text-right" : ""}`}>
      <div className="mb-2.5 text-[22px] font-extrabold tracking-[-0.015em]">
        {title}
      </div>
      <div className="text-[15px] leading-[1.65] text-muted">{body}</div>
    </div>
  );
  return (
    <div
      className={`grid grid-cols-1 gap-6 md:gap-6 ${
        reversed ? "md:grid-cols-[1fr_120px]" : "md:grid-cols-[120px_1fr]"
      } ${last ? "" : "mb-11 border-b border-edge pb-11"}`}
    >
      {reversed ? (
        <>
          {text}
          {number}
        </>
      ) : (
        <>
          {number}
          {text}
        </>
      )}
    </div>
  );
}
