type IconProps = { className?: string };

export function PawIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="28" height="28" aria-hidden>
      <circle cx="8" cy="8" r="2.2" fill="currentColor" />
      <circle cx="13" cy="6.5" r="2" fill="currentColor" />
      <circle cx="17" cy="9" r="1.8" fill="currentColor" />
      <circle cx="6" cy="12" r="1.7" fill="currentColor" />
      <path
        d="M10 11c2.5 0 4.5 2 4.5 5.2 0 2.2-1.8 3.8-4.5 3.8S5.5 18.4 5.5 16.2C5.5 13 7.5 11 10 11z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BulbIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="28" height="28" aria-hidden>
      <path
        d="M12 2a7 7 0 0 0-4 12.7V18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.3A7 7 0 0 0 12 2z"
        fill="currentColor"
      />
      <path d="M10 22h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="28" height="28" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SparkMarks({ color }: { color: 'purple' | 'orange' | 'red' }) {
  return (
    <svg
      className={`about-spark about-spark--${color}`}
      viewBox="0 0 32 24"
      width="32"
      height="24"
      aria-hidden
    >
      <path d="M4 20 L8 4 L12 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 22 L18 8 L22 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
