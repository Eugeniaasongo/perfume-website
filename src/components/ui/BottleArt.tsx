import Image from "next/image";

const TINTS: Record<string, [string, string]> = {
  men: ["#3B2414", "#8A5A2B"],
  women: ["#5A1F2B", "#C27A86"],
  unisex: ["#4A3216", "#D1A659"],
};

function tintFor(category: string, slug: string): [string, string] {
  const base = TINTS[category.toLowerCase()];
  if (base) return base;
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return Object.values(TINTS)[hash % 3];
}

interface BottleArtProps {
  title: string;
  slug: string;
  category: string;
  concentration?: string;
  imageUrl?: string | null;
  size?: "sm" | "lg";
  priority?: boolean;
}

/**
 * Product visual. Uses real photography when the product has an image,
 * otherwise renders a consistent branded bottle so the catalog never shows stock photos.
 */
export function BottleArt({
  title,
  slug,
  category,
  concentration = "Extrait de Parfum",
  imageUrl,
  size = "sm",
  priority,
}: BottleArtProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={`${title} by RYZ Parfums`}
        fill
        priority={priority}
        sizes={size === "lg" ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
        className="object-cover"
      />
    );
  }

  const [deep, light] = tintFor(category, slug);
  const gradientId = `liquid-${slug}`;
  const glassId = `glass-${slug}`;
  const words = title.replace(/\b(EXTRAIT|EDP|EDT)\b/gi, "").trim().split(/\s+/);

  return (
    <svg
      viewBox="0 0 200 260"
      role="img"
      aria-label={`${title} by RYZ Parfums`}
      className="absolute inset-0 m-auto h-[82%] w-auto drop-shadow-[0_18px_24px_rgba(42,24,16,0.18)]"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} stopOpacity="0.85" />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="18%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="80%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* Cap */}
      <rect x="72" y="8" width="56" height="46" rx="3" fill="#B8923A" />
      <rect x="72" y="8" width="56" height="46" rx="3" fill={`url(#${glassId})`} />
      <rect x="82" y="54" width="36" height="12" fill="#8A6A23" />
      {/* Bottle */}
      <rect x="30" y="66" width="140" height="186" rx="10" fill={`url(#${gradientId})`} />
      <rect x="30" y="66" width="140" height="186" rx="10" fill={`url(#${glassId})`} />
      <rect x="30.5" y="66.5" width="139" height="185" rx="9.5" fill="none" stroke="#fff" strokeOpacity="0.35" />
      {/* Label */}
      <rect x="54" y="122" width="92" height="84" fill="#FAF7F2" fillOpacity="0.94" />
      <rect x="58" y="126" width="84" height="76" fill="none" stroke="#B8923A" strokeWidth="0.75" />
      <text x="100" y="146" textAnchor="middle" fontSize="13" letterSpacing="4" fill="#B8923A" fontFamily="Georgia, serif">
        RYZ
      </text>
      {words.slice(0, 2).map((word, i) => (
        <text
          key={word + i}
          x="100"
          y={166 + i * 12}
          textAnchor="middle"
          fontSize="8.5"
          letterSpacing="1.6"
          fill="#0E0D0B"
          fontFamily="system-ui, sans-serif"
          fontWeight="500"
        >
          {word.toUpperCase()}
        </text>
      ))}
      <text x="100" y="196" textAnchor="middle" fontSize="5.5" letterSpacing="1.4" fill="#6B655C" fontFamily="system-ui, sans-serif">
        {concentration.toUpperCase()}
      </text>
    </svg>
  );
}
