# Original OLAF Refinement Implementation Plan

> For agentic workers: execute within this isolated worktree; parallel independent asset work and one fresh whole-change review.

**Goal:** Refine the original OLAF without replacing its design.
**Architecture:** Preserve static HTML/CSS/JS and model behavior; scoped CSS adjustments and pure presentation helpers. Responsive image manifests and an integrated MapLibre geography layer.
**Tech Stack:** Existing vanilla JS/CSS, MapLibre, cwebp/AVIF derivation, selective SwinIR, Playwright.
**Spec:** ../specs/2026-10-23-original-refinement.md

## Global Constraints
- Preserve original palette, Inter, routes, all evidence and local saved identities.
- No global redesign, new cards, data migration or deployment.
- Existing functions and accessibility remain operational; sources and map attribution retained.

## Review Focus
- Tall/long station names and groups with multiple map points.
- Failed map or image requests retain usable location/source information.
- Mobile/zoom/keyboard focus and sticky header cannot obscure controls.
- Image swaps cannot race, show the previous station, or claim false source detail.
- Event cover selection must not alter event membership or evidence.

### Task1: Responsive context photography
Files: scene-data.js, scene-photo.js (new), media/scenes/refined/*, provenance.
- [x] Select higher resolution official scenes, derive responsive WebP/AVIF variants with known dimensions; SwinIR only when appropriate.
- [x] Add pure photo candidate/source metadata and render helper; integrate with premium.js photo function.
- [x] Verify all referenced files/dimensions, view sources at equivalent scale, source traceability.

### Task2: Event framing
Files: event-explorer.js, event-covers.js (new), media/covers/*.
- [x] Choose deliberate cover assets and focal positions; prefer readable original ratios/landscape footage.
- [x] Preserve subtle original stack treatment; no frame/box additions.
- [x] Verify real cover selections in default and filtered states; suite remains33/33.

### Task3: Header, geography and density
Files: index.html, premium.js, refinement.css (new), DESIGN.md.
- [x] Add visible station-switch hint retaining original title/menu.
- [x] Integrate borderless map in header with feathered edges, shared palette, readable place/attribution and full map link.
- [x] Compact blank space and secondary control explanation; preserve44px targets and all functions.
- [x] Ensure brands photography fades before directory; tune desktop widths.

### Task4: Preview and verification
Files: QA scripts and screenshots in parent outputs/olaf-refinament.
- [x] Run33 original tests; meaningful behavioral regression checks for actual JS changes.
- [x] Render Chromium/WebKit at desktop1280/1440/1920; check overflow, map failure, source, saved state, station switch and reduced motion.
- [x] Fresh review against original design and user’s approved scope; fix material issues.
- [x] Serve preview; capture final screenshots; report local-only status and remaining source limitations.

User scope update: desktop only. Remove authored mobileCSS, artdirection variants and mobile delivery captures; preserve existing source rules.
