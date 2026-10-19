import Link from "next/link";

export function CrownMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2 17h28M3.5 14 2 4l7.5 6L16 1l6.5 9L30 4l-1.5 10h-25Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="2" cy="4" r="1.3" fill="currentColor" />
      <circle cx="16" cy="1.3" r="1.3" fill="currentColor" />
      <circle cx="30" cy="4" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function Logo({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="RYZ Parfums home"
      className={`group inline-flex flex-col items-center leading-none ${className}`}
    >
      <CrownMark className="mb-1 h-3 w-5 text-brand-gold transition-transform duration-300 group-hover:-translate-y-0.5" />
      <span className="font-display text-[26px] font-semibold tracking-[0.32em] text-brand-gold">RYZ</span>
      <span
        className={`mt-0.5 text-[8px] font-medium tracking-[0.55em] ${
          tone === "dark" ? "text-ink" : "text-ivory/80"
        }`}
      >
        PARFUMS
      </span>
    </Link>
  );
}
