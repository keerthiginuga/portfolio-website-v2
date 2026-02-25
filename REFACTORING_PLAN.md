# Portfolio V2 — Refactoring Audit & Plan

## Current Architecture

```
portfolio-v2/
├── index.html          (334 lines) — Home page
├── works.html          (150 lines) — All Works page
├── about.html          (87 lines)  — About Me page
├── script.js           (819 lines) — Home page JS (monolithic)
├── works-script.js     (296 lines) — Works page JS
├── styles.css          (2006 lines) — All CSS (monolithic)
├── react-components/   — Unused React components (dead code)
│   ├── ParallaxProjectCard.tsx
│   └── PerspectiveCard.tsx
├── assets/images/      — Project images
├── server.log          — Server log file (should be gitignored)
└── README.md
```

---

## Issues Found

### 1. DEAD CODE — React Components (Critical)
- `react-components/ParallaxProjectCard.tsx` and `PerspectiveCard.tsx` are **never used**
- They import React/Framer Motion but the site is vanilla HTML/CSS/JS
- These were likely prototypes that were replaced by the vanilla implementation

### 2. DUPLICATED NAV/LOGO HTML (Across all 3 pages)
- The logo SVG (~14-line SVG block) is copy-pasted identically in all 3 HTML files
- The nav bar HTML (~18 lines) is copy-pasted identically in all 3 HTML files
- The SVG filter for nav glass effect (~12 lines) is duplicated in `index.html` and `about.html`
  (works.html omits it but inherits it from the shared class)
- **Active link** (`is-active`) is hardcoded differently per page

### 3. DUPLICATED NAV HIDE/SHOW LOGIC (script.js + works-script.js)
- `script.js` lines 776-818: IIFE for nav hide/show on scroll
- `works-script.js` lines 130-143: Same nav hide/show logic (slightly different because it uses Lenis)
- Both check scroll > 20 for `nav-scrolled`, scroll > 100 for `nav-collapsed`

### 4. DUPLICATED LERP FUNCTION
- `works-script.js` line 204: `function lerpFn(a, b, t) { return a + (b - a) * t; }`
- `script.js` line 42-43: Inline LERP `v2Current.x += (v2Pointer.x - v2Current.x) * smoothing`
- Both implement the same linear interpolation pattern

### 5. DUPLICATED CURSOR PATTERN
- `script.js` lines 619-773: Quote cursor with LERP-based animation
- `works-script.js` lines 272-293: View cursor with LERP-based animation
- Both use the same mouseX/mouseY → cursor position LERP pattern

### 6. HARDCODED PROJECT DATA (in JS and HTML)
- `script.js` lines 180-225: Project data hardcoded in `initV2SelectWorksCard()`
- `works.html` lines 59-136: Project data hardcoded in HTML
- `index.html` line 96: Marquee text hardcoded
- No single source of truth for project information

### 7. MONOLITHIC script.js (819 lines)
Contains 8+ independent features in one file:
1. Hero parallax (lines 1-97)
2. Logo rotation (lines 107-128)
3. Select works card flip (lines 130-510) — **380 lines!**
4. Skills accordion (lines 514-545)
5. Quote scroll animation (lines 549-592)
6. See All animation (lines 596-617)
7. Quote cursor (lines 619-773) — **155 lines!**
8. Nav hide/show (lines 776-818)

### 8. MONOLITHIC styles.css (2006 lines)
All CSS for all 3 pages in one file. Includes:
- Shared components (nav, logo, footer)
- Home page sections (hero, select works, skills, quote)
- Works page styles
- About page styles
- 6 media query blocks scattered throughout

### 9. HARDCODED COLORS
- `#f2f2f2` used 3 times (panel background, see-all bg, skills bg)
- `#111` used 3 times
- `#0d0d0d` used once (skills accordion)
- `#0a0a0a` used once (works page bg)
- `rgba(249, 253, 254, ...)` used 10+ times (should be `var(--v2-color-white)` with alpha)
- `rgba(0, 0, 0, ...)` used 20+ times
- Various box-shadows repeated identically

### 10. DUPLICATED CSS — Box Shadow
The exact same `box-shadow` is used in 3 places:
- `.v2-nav-inner` (line 84-87)
- `.v2-nav.nav-scrolled .v2-nav-inner` (line 98-101) — IDENTICAL
- `.v2-nav.nav-collapsed .v2-nav-inner` (line 109-112) — IDENTICAL

### 11. DUPLICATED CSS — Backdrop Filter
The exact same `backdrop-filter` chain appears in:
- `.v2-nav.nav-scrolled .v2-nav-inner` (line 96-97)
- `.v2-nav.nav-collapsed .v2-nav-inner` (line 107-108) — IDENTICAL

### 12. DUPLICATED CSS — Image Cover Pattern
```css
width: 100%; height: 100%; object-fit: cover; display: block;
```
Repeated for `.v2-hero-card img`, `.v2-skills-thumb img`, `.v2-quote-photo img`,
`.v2-sonix-media img`, `.v2-stack-img`, `.v2-sonix-media img[data-layer]` (x3)

### 13. DUPLICATED CSS — backface-visibility
```css
backface-visibility: hidden; -webkit-backface-visibility: hidden;
```
Used 4 times across different selectors

### 14. MULTIPLE DOMContentLoaded LISTENERS
`script.js` has **6 separate** `DOMContentLoaded` listeners:
- Line 99: `initV2Hero()` + `initV2LogoRotation()`
- Line 512: `initV2SelectWorksCard`
- Line 547: `initV2Skills`
- Line 594: `initV2Quote`
- Line 617: `initV2SeeAllAnimation`
- Line 775: `initV2QuoteCursor`

### 15. INCONSISTENT CACHE BUSTING
- `index.html`: `styles.css?v=58`, `script.js?v=58`
- `works.html`: `styles.css?v=60`, `works-script.js?v=4`
- `about.html`: `styles.css?v=58`, `script.js?v=58`

### 16. BODY CLASS DUPLICATION
- `body.v2-home` is used for general dark styles
- `body.v2-about-page` **duplicates** the same font-family, background, color, overflow-x
- `body.v2-works-page` also needs `min-height: 100vh` + dark bg

### 17. MEDIA QUERIES SCATTERED
6 `@media` blocks scattered across the file instead of being consolidated:
- Lines 811-887: `max-width: 1024px` (home)
- Lines 889-1029: `max-width: 767px` (home)
- Lines 1031-1039: `prefers-reduced-motion`
- Lines 1301-1308: `max-width: 840px` (skills)
- Lines 1555-1573: `max-width: 1024px` (quote)
- Lines 1577-1606: `max-width: 767px` (quote/footer)
- Lines 1815-1818: `max-width: 1024px` (works)
- Lines 1821-1846: `max-width: 767px` (works)
- Lines 1970-1993: `max-width: 900px` (about)
- Lines 1997-2006: `max-width: 480px` (about)

### 18. PERFORMANCE — Large Image
- `autonomous-vehicle.jpg` is **8.5 MB** — should be optimized

### 19. UNUSED CSS CLASS
- `.v2-skills-grid` (line 1064) — referenced in CSS but not in any HTML
- `.v2-skills-name` (line 1582) — referenced in CSS media query but not in HTML
- `.v2-see-all-works` (line 1022) — referenced in CSS media query but not in HTML

### 20. server.log COMMITTED
- `server.log` (37KB) should be in `.gitignore`

---

## Refactoring Plan (Incremental)

### Phase 1: Remove Dead Code ✂️
1. Delete `react-components/` directory
2. Delete `server.log`
3. Remove unused CSS classes

### Phase 2: Extract Constants & Data ✂️
1. Create `data/projects.js` — single source of truth for project data
2. Add more CSS custom properties for repeated colors

### Phase 3: Consolidate JavaScript ✂️
1. Merge all DOMContentLoaded listeners into one
2. Extract shared utilities (lerp, clamp, RAF throttle) into `utils.js`
3. Extract nav controller into `nav.js`
4. Extract cursor system into `cursor.js`
5. Keep `home.js` for home-page-specific features

### Phase 4: CSS Cleanup ✂️
1. Add CSS custom properties for repeated values
2. Consolidate duplicate box-shadows and backdrop-filters
3. Add utility class for the image cover pattern
4. Organize media queries per section

### Phase 5: HTML Templates ✂️
1. Extract shared nav/logo into a JS-injected component or separate includes
2. Standardize cache-busting approach
