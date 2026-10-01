# RYZ Parfums Design Brief & Brand Identity Guidelines

## 1. Brand Identity Overview
RYZ Parfums is a premium Ghanaian fragrance house crafting long-lasting luxury perfumes inspired by iconic designer and niche scents. The brand represents accessible opulence, high longevity, and exceptional quality without the inflated luxury markup.

## 2. Color Palette & Contrast Tokens

| Token Name | Hex Code | Usage | Contrast Target |
| :--- | :--- | :--- | :--- |
| **Brand Black** | `#000000` | Utility bar, primary text, dark editorial hero sections, button fills | WCAG AAA on White |
| **Brand White** | `#FFFFFF` | Page backgrounds, high-space catalog containers, text on dark | WCAG AAA on Black |
| **Metallic Gold** | `#B8923A` | Logo crown & text accents, variant underline, rating stars | Accent / Focus State |
| **Gold Dark Accent** | `#8A6A23` | High-contrast gold text elements, trust message badges | WCAG AA on White |
| **Alert Red** | `#C8102E` | **ONLY** for the "INSPIRED BY" label | Distinctive tag |
| **Warm Amber / Dark Brown**| `#2A1810` | Low-key hero background, editorial fragrance card accents | Dark theme backing |
| **Neutral Grey** | `#666666` | Secondary specs, notes descriptions, volume labels | Subtitle text |
| **Light Grey** | `#F5F5F5` | Background cards, input fills, subtle borders | Structural framing |

## 3. Typography Scale
- **Primary Font**: Wide Geometric Sans (`Jost` / `Montserrat`)
- **Accent Script**: Thin Italic Script (Used exclusively for "Out of stock" accents or subtle editorial notes)

### Scale Definitions
- **Display Hero Headline**: `36px` / `48px` desktop, uppercase tracked (`tracking-wider`), font-semibold.
- **Section Heading (H2)**: `24px` / `32px`, uppercase tracked (`tracking-widest`), font-medium.
- **Product Title**: `16px` / `20px`, uppercase tracked (`tracking-wider`), font-bold.
- **Inspired By Tag**: `12px`, uppercase bold, alert red (`#C8102E`).
- **Body & Specifications**: `14px` / `16px`, regular/medium.

## 4. Key UI Components & Upgrades

### Header & Navigation
- Top thin black utility bar containing contact info, WhatsApp link, and compact search.
- Centered RYZ logo featuring gold crown and spaced gold "RYZ" wordmark over "P A R F U M S".
- Prominent **"CASH ON DELIVERY ACCEPTED"** trust message badge rendered on all pages including cart, drawer, and checkout.

### Signature Product Card
- Side-by-side bottle representation: Large RYZ clear glass bottle with gold cap on the left, smaller inspiration bottle photo on the right.
- Distinct red uppercase `"INSPIRED BY"` label followed by designer and scent name.
- Clear multi-line hierarchy separating brand, product title, concentration, size, and price ("From GHS 299.00" with gold accent line).
- Interactive quick-add, size chips, wishlist heart toggle, and second hover image.

### Hero & Motion Guidelines
- Hero slideshow autoplay (6s intervals) with pause-on-hover and `prefers-reduced-motion` compliance.
- Fast, non-distracting UI micro-transitions (200ms - 400ms duration).
