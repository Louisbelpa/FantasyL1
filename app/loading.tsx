export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6" aria-busy>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-raised" />
      <div className="mt-2 h-4 w-40 animate-pulse rounded bg-surface" />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <div className="flex flex-col gap-4">
          <div className="h-11 animate-pulse rounded-xl bg-surface" />
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-raised" />
          <div className="h-36 animate-pulse rounded-2xl bg-surface" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-28 animate-pulse rounded-2xl bg-surface" />
          <div className="h-40 animate-pulse rounded-2xl bg-surface" />
          <div className="h-52 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    </main>
  );
}
