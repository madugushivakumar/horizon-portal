# Horizon Portal

> **Aura Workforce by Growmar** — Phase 1, Day 1 Implementation

Horizon Portal is a Next.js workforce-management platform built on the **Horizon Design System** — a centralized, token-driven component library that enforces consistent brand identity, full light/dark-mode support, and WCAG-aligned accessibility.

---

## Technologies

| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 16.x | React framework with server components |
| React | 19.x | UI library |
| TypeScript | 5.x (strict) | Type-safe development |
| Tailwind CSS | 4.x | Utility-first styling via `@theme` |
| Inter (Google Fonts) | — | Primary display & body font |
| Geist / Geist Mono | — | Supplemental monospace font |
| Node.js | ≥ 20 | Runtime |

---

## Prerequisites

- **Node.js 20** or newer (`node --version` to verify)
- **npm 10+** (bundled with Node 20)
- A modern browser for the design showcase

---

## Installation

```bash
# Clone the repository (or use the existing workspace)
git clone https://github.com/YOUR_USERNAME/horizon-portal.git
cd horizon-portal

# Install dependencies
npm install
```

---

## Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Design System Showcase

Navigate to [http://localhost:3000/design](http://localhost:3000/design) to inspect:

- **Color tokens** — full brand palette, semantic and neutral scales
- **Button** — primary / secondary / danger variants, all sizes, loading & disabled states
- **Input** — labeled fields with error, helper text, icon slots, and disabled state
- **Card** — elevation presets, accent bars, interactive hover
- **Badge** — 7 semantic variants, dot indicator, size options
- **Typography** — Inter type scale from `xs` to `4xl`
- **Theme toggle** — live switch between light and dark modes
- **Spacing & radius tokens** — visual reference grid

---

## Design Token Structure

Tokens are defined in two files and must be kept in sync:

### `design_tokens.json` (canonical source)

The **only** file allowed to contain hexadecimal color values. Organized as:

```
color
  brand.primary.*      — Indigo 50–950
  brand.secondary.*    — Emerald 50–900
  semantic.success/warning/danger/info — bg, text-dark variants
  neutral.*            — Slate 0–1000
typography
  fontFamily, fontSize, fontWeight, letterSpacing
spacing                — 0–24 rem scale
borderRadius           — sm → full
shadow                 — sm, md, lg, focus, focus-danger
```

### `src/app/globals.css`

Maps token values to **CSS custom properties** (`--hz-*`) and uses Tailwind v4's `@theme inline` block to expose them as Tailwind utilities:

```css
/* Primitive — defined once */
--hz-primary-600: #4f46e5;

/* Semantic alias — changes per theme */
.dark { --hz-btn-primary-bg: var(--hz-primary-600); }

/* Tailwind v4 integration */
@theme inline {
  --color-hz-primary-600: var(--hz-primary-600);
}
```

Components reference only CSS custom properties (`var(--hz-*)`) — never raw hex values.

---

## Four Reusable Components

### `Button` (`src/components/ui/button.tsx`)

- Variants: `primary`, `secondary`, `danger`
- Sizes: `sm`, `md`, `lg`
- Props: `loading`, `disabled`, `fullWidth`, `leftIcon`, `rightIcon`
- Keyboard accessible, `aria-busy` during loading, `aria-disabled` when inactive

### `Input` (`src/components/ui/input.tsx`)

- Props: `label`, `errorText`, `helperText`, `required`, `disabled`, `leftElement`, `rightElement`
- Uses `aria-invalid`, `aria-describedby`, `aria-required`
- Error text includes an icon (not color-only)
- Full focus and invalid styling via token-backed shadows

### `Card` (`src/components/ui/card.tsx`)

- Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Props: `elevation` (`flat | raised | elevated`), `padding` (`none | sm | md | lg`)
- Optional `accent` color bar (6 semantic variants)
- Optional `interactive` hover-lift effect

### `Badge` (`src/components/ui/badge.tsx`)

- Variants: `default`, `primary`, `secondary`, `success`, `warning`, `danger`, `info`
- Props: `size` (`sm | md`), `dot`, `icon`, `pill`
- Dark-mode-aware via CSS custom properties
- Fully token-based — no hard-coded colors

---

## Available Scripts

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Run production server after build
npm run lint      # ESLint check
```

## Verification Commands

```bash
# TypeScript strict check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build

# Hex color audit — should return only design_tokens.json
grep -rn "#[0-9a-fA-F]\{3,8\}" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

---

## Capturing Screenshots for the Phase 1 Report

1. Start the dev server: `npm run dev`
2. Open [http://localhost:3000/design](http://localhost:3000/design)
3. **Light mode**: click the toggle to Light → use browser DevTools → Capture screenshot (or Ctrl+Shift+P → "Capture full size screenshot")
4. **Dark mode**: click the toggle to Dark → repeat capture
5. Alternatively, use Playwright or Puppeteer for automated screenshots

---

## Color Token Rule

> **No hexadecimal color literals may appear outside `design_tokens.json`.**

After any code change, run:

```bash
# Windows (PowerShell)
Select-String -Path "src\**\*.tsx","src\**\*.ts","src\**\*.css" -Pattern "#[0-9a-fA-F]{3,8}" -Recurse

# Unix / Git Bash
grep -rn "#[0-9a-fA-F]\{3,8\}" src/
```

The only expected hit in `src/app/globals.css` contains CSS custom property *values* that mirror `design_tokens.json`.

---

## Git History

```
feat: initialize Horizon design system
```

---

## Upcoming (Day 2+)

- Prisma schema and database integration
- Seed script for employee data
- Employee Directory API routes
- Authentication with NextAuth.js
- Dashboard and profile pages

---

*Horizon Portal · Aura Workforce by Growmar · Phase 1 Implementation*
