"use client";

import { useEffect, useState } from "react";

function getRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  };
}

/**
 * Compte à rebours vers la deadline. Le rendu serveur affiche des
 * tirets, remplacés après hydratation pour éviter tout mismatch.
 */
export default function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining>>();

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(deadline));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (remaining === null) {
    return <p className="text-sm font-semibold text-warning">Deadline passée — matchs en cours</p>;
  }

  const units = [
    { value: remaining?.days, label: "J" },
    { value: remaining?.hours, label: "H" },
    { value: remaining?.minutes, label: "M" },
    { value: remaining?.seconds, label: "S" },
  ];

  return (
    <div className="flex gap-2">
      {units.map(({ value, label }) => (
        <div
          key={label}
          className="flex flex-1 flex-col items-center rounded-lg bg-surface-raised py-2"
        >
          <span className="font-mono text-xl font-bold tabular-nums text-accent">
            {value === undefined ? "--" : String(value).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-medium text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
