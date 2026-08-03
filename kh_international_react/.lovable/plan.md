# KH International — Vetiver Oil Landing Page

Build a single-page editorial B2B site at `/` following the provided design system and section-by-section spec.

## Design System (src/styles.css)

- Tokens (OKLCH equivalents):
  - `--background`: #FFFFFF (crisp white)
  - `--foreground`: #1a1a1a
  - Custom: `--forest` #3B533E, `--gold` #C1A661, `--alabaster` #F5F1EA
  - `--primary`: gold; `--primary-foreground`: white
- Fonts loaded via `<link>` in `src/routes/__root.tsx`:
  - Headings: **Cormorant Garamond** (high-contrast serif)
  - Body: **Inter** (geometric sans)
  - Register `--font-serif` / `--font-sans` in `@theme`
- Utilities for gold hairline dividers and section rhythm.

## Assets

- KH logo: register uploaded logo via `lovable-assets` from `/mnt/user-uploads/WhatsApp_Image_2026-07-24_at_8.21.22_PM.jpeg` → `src/assets/kh-logo.asset.json` (used in nav + footer).
- Generate 5 premium images with `imagegen` (fast tier) saved to `src/assets/`:
  1. `hero-oil-drop.jpg` — macro golden vetiver oil drop with botanical hints
  2. `about-sourcing.jpg` — dark forest-green toned sourcing/farmer hands with roots
  3. `product-vetiver-roots.jpg` — detailed vetiver roots / extraction still
  4. `sustainability-community.jpg` — farming community, warm natural light
  5. `markets-global.jpg` — abstract premium graphic evoking France/global export
- India market visual: inline SVG line-art of India map in gold (no image gen).

## Route + Structure

Replace placeholder `src/routes/index.tsx`. Add per-route `head()` with:
- title: "KH International — Premium Vetiver Oil for Fragrance & Beauty"
- description, og:title, og:description, og:type=website, twitter:card=summary_large_image

Break page into components under `src/components/kh/`:
- `Nav.tsx` — minimal sticky nav: logo left, section anchors center, gold "Request Sample" CTA right
- `Hero.tsx` — 60/40 split, serif headline, gold CTA, trust-points ticker row at bottom
- `About.tsx` — 50/50, left forest-green image block, right story + gold pull-quotes (Vision/Mission)
- `Product.tsx` — 50/50 reversed, left copy + 2-col checklist with gold hairlines, right roots image
- `Sustainability.tsx` — 50/50 on alabaster bg, left image, right copy
- `MarketsIndia.tsx` — 50/50 reversed, right SVG India graphic
- `MarketsFrance.tsx` — 50/50, left global graphic
- `Quality.tsx` — centered, shadcn `Accordion` for COA / MSDS / Specs / Packaging + "Built for expansion" teaser
- `Contact.tsx` — centered white contact form (react-hook-form + zod validation, no backend wiring — submit shows toast), three gold CTAs
- `Footer.tsx` — full-width forest green, centered logo + closing statement + fine gold divider

All copy sourced from the uploaded `KH_website_content.pdf` (parsed during build).

## Interaction / Validation

- Form uses `zod` schema: trimmed strings, email format, max lengths, phone optional.
- Submit → `sonner` toast "Thanks — we'll be in touch". No server function (pure presentation as requested).
- Smooth-scroll anchor links from nav to section IDs.

## Out of Scope

- No backend, no Cloud enablement, no email delivery — form is presentation only.
- No dark mode work (brand is light-first).

## Technical Notes

- Tailwind v4: define colors in `@theme` in `src/styles.css`; load Google Fonts via `<link>` in `__root.tsx` head (never `@import` remote in CSS).
- Zigzag uses `lg:grid-cols-2` with `lg:order-2` to flip sides; stacks single-column on mobile.
- Use semantic tokens only in components (`bg-background`, `text-foreground`, `bg-[--forest]` via arbitrary token, or add `bg-forest` utility by registering `--color-forest`).
