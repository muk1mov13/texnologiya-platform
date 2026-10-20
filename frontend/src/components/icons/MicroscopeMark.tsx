/** "BIO 🔬 AKADEMIYA" logotipidagi mikroskop belgisi (chiziqli, `currentColor`). */
export function MicroscopeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <g transform="rotate(-32 18 13)">
        <rect x="15" y="1.5" width="6" height="3.5" rx="1" />
        <rect x="14" y="5" width="8" height="13" rx="1.5" />
        <path d="M16 18v3.5h4V18" />
      </g>
      <path d="M13.5 16.5C5.5 19 5 31 13 32.5" />
      <path d="M13 32.5h7.5M17 28.5h13" />
      <path d="M9 37.5h14" />
      <path d="M14.5 32.5v5" />
    </svg>
  )
}
