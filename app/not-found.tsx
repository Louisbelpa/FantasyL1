import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-4xl">🚩</p>
      <h1 className="text-xl font-bold">Hors-jeu — page introuvable</h1>
      <p className="max-w-md text-sm text-muted">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90"
      >
        Retour à Mon Équipe
      </Link>
    </main>
  );
}
