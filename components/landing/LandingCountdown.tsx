"use client";

import { useEffect, useState } from "react";

function format(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "00:00:00";
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const h = Math.floor((totalSeconds % 86_400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const hms = `${pad(h)}:${pad(m)}:${pad(s)}`;
  // Deadline lointaine : préfixe en jours pour garder un format lisible.
  return days > 0 ? `${days}j ${hms}` : hms;
}

/**
 * Compte à rebours HH:MM:SS vers la deadline, façon « broadcast ».
 * Rendu neutre avant hydratation pour éviter tout mismatch.
 */
export default function LandingCountdown({
  deadline,
  className,
}: {
  deadline: string;
  className?: string;
}) {
  const [value, setValue] = useState("--:--:--");

  useEffect(() => {
    const tick = () => setValue(format(deadline));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <span className={className} suppressHydrationWarning>
      {value}
    </span>
  );
}
