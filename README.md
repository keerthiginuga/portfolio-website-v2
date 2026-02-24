# Portfolio V2 (Scratch Build)

This is an independent V2 website codebase built from scratch.

## Locked Plan Requirement

- The V2 website must be fully responsive across desktop, laptop, tablet, and mobile devices.
- Every section implementation checkpoint must include responsive behavior and validation before sign-off.
- Motion/interaction should degrade gracefully on touch devices and when reduced-motion is enabled.

## Run locally

From the repo root:

```bash
python3 -m http.server 9000
```

Then open:
- Legacy site: `http://localhost:9000/index.html`
- V2 site: `http://localhost:9000/portfolio-v2/index.html`

## React Component Deliverable

- `react-components/ParallaxProjectCard.tsx` contains the requested modular React + Framer Motion + Tailwind component:
  - background marquee
  - perspective container
  - mouse tilt mapped to -10deg..10deg via motion values and springs
  - preserve-3d layered mockups with translateZ depth
  - auto project switch each full 360deg card rotation

## Deployment options

1. Deploy legacy by publishing repo root.
2. Deploy V2 by publishing `portfolio-v2/` as the site root.
3. Keep both live using separate deploy targets/domains.
