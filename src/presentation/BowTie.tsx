export function BowTie({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M1.5 2.2 L1.5 13.8 L13 8 Z M30.5 2.2 L30.5 13.8 L19 8 Z M13 5.2 L19 5.2 L19 10.8 L13 10.8 Z"
      />
    </svg>
  );
}
