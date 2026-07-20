"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-4xl">🟥</p>
      <h1 className="text-xl font-bold">Carton rouge — une erreur est survenue</h1>
      <p className="max-w-md text-sm text-muted">
        Quelque chose s&apos;est mal passé de notre côté. Réessayez ; si le
        problème persiste, revenez un peu plus tard.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90"
      >
        Réessayer
      </button>
    </main>
  );
}
