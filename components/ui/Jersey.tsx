export default function Jersey({
  primary,
  secondary,
  className = "h-9 w-9 drop-shadow sm:h-11 sm:w-11",
}: {
  primary: string;
  secondary: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 22" className={className} aria-hidden>
      {/* Manches */}
      <path d="M7 2 1.5 5 4 9.5 7 8Z" fill={secondary} stroke="#0b0f19" strokeWidth="0.6" />
      <path d="M17 2 22.5 5 20 9.5 17 8Z" fill={secondary} stroke="#0b0f19" strokeWidth="0.6" />
      {/* Corps */}
      <path
        d="M7 2h3a2 2 0 0 0 4 0h3v18H7Z"
        fill={primary}
        stroke="#0b0f19"
        strokeWidth="0.6"
      />
    </svg>
  );
}
