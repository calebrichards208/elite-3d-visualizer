# PRD: Elite Bathroom 3D Visualizer — MVP 1.0

## Problem Statement

During in-home sales appointments, Caleb needs a way to walk homeowners through bathroom design options so they can visualize their remodel and lock down selections before leaving the appointment. The current tool — a manufacturer-provided dealer configurator from BathConcepts/BCI (Epigraph platform) — fails in this context for three reasons:

1. **It lags over cellular.** Every selection fires external requests to check manufacturer inventory. On a phone or iPad over 5G in a customer's home, this causes freezes and stutters that kill the sales momentum.
2. **It overwhelms the homeowner.** Thousands of SKU variations, manufacturer parts, and configurations are shown — most of which Elite doesn't sell. Decision fatigue sets in before they reach the options that matter.
3. **Pricing is not ours to control.** The BCI tool does not allow Elite's proprietary retail pricing, local labor costs, or target margins to be embedded.

The result: selections don't get locked at the appointment, quotes get delayed, and the design experience reflects poorly on Elite's premium brand positioning.

## Solution

A self-contained, offline-capable 3D bathroom configurator built specifically for Elite's product line and sales process. Caleb opens the app on a tablet at the customer's home, and they build the bathroom together in real time. The 3D render updates instantly as each selection is made — no network calls, no lag, no irrelevant options.

MVP 1.0 covers the 7 decisions that actually matter in an Elite bathroom appointment. Everything else is deferred.

## User Stories

1. As Caleb, I want to open the app on my tablet at a customer's home without needing a strong internet connection, so that the appointment doesn't stall waiting for the tool to load.
2. As Caleb, I want the app to load all assets upfront on launch, so that every selection change is instant with no delay.
3. As Caleb, I want to see a 3D bathroom render that takes up most of the screen, so that the homeowner can clearly visualize the space we're discussing.
4. As Caleb, I want a floating selection panel on the right side of the screen, so that the design choices don't obstruct the 3D view.
5. As Caleb, I want to choose between a Tub conversion and a Shower as the first decision, so that the right base model loads for the rest of the appointment.
6. As Caleb, I want the 3D model to update immediately when I change the base type, so that the homeowner sees the space as it will actually look.
7. As Caleb, I want to browse all acrylic wall panel colors in a thumbnail grid, so that the homeowner can see their options at a glance.
8. As Caleb, I want to select a wall color and see it applied to the 3D panels instantly, so that the homeowner can compare options without delay.
9. As Caleb, I want to add a laser etch pattern on top of the selected wall color, so that the homeowner can see how decorative patterns look with their chosen color.
10. As Caleb, I want a "None" option for the laser etch pattern, so that smooth solid panels are clearly the default.
11. As Caleb, I want to choose a trim and fixture color (Chrome, Brushed Nickel, Matte Black, Brushed Gold, Oil Rubbed Bronze), so that all metal finishes in the bathroom coordinate.
12. As Caleb, I want the fixture color selection to update the visible trim, valve, and hardware in the 3D scene, so that the homeowner sees a cohesive finish.
13. As Caleb, I want to choose between a curtain rod and a glass shower door enclosure, so that the homeowner can compare the look and cost difference.
14. As Caleb, I want to choose a seat option (None, Bench, Fold-down, Hexagonal corner), so that accessibility and comfort preferences are captured.
15. As Caleb, I want the selected seat to appear in the correct position in the 3D scene, so that the homeowner can see how much space it uses.
16. As Caleb, I want to choose a shelf option (None, Corner shelf, Niche shelf), so that storage preferences are locked in during the appointment.
17. As Caleb, I want all 7 category sub-tabs always visible at the bottom of the selection panel, so that I can jump back to any decision without losing the current state.
18. As Caleb, I want tapping any category tab to show that category's options immediately, so that revising a choice mid-appointment is frictionless.
19. As Caleb, I want the currently selected option in each category to be visually highlighted, so that I can see the full current configuration at a glance from the panel.
20. As Caleb, I want a "View Summary" button that shows all 7 selections on one screen, so that I can review the final design with the homeowner before wrapping up.
21. As Caleb, I want the summary screen to display each category name alongside the selected option label and thumbnail, so that the homeowner has a clear picture of what they chose.
22. As a homeowner, I want to see my selections reflected in a realistic 3D bathroom, so that I feel confident about what I'm agreeing to.
23. As a homeowner, I want to be able to say "actually, can we try that in a different color?" and see the change instantly, so that I feel in control of the design process.
24. As a homeowner, I want the interface to feel premium and modern, so that it matches my expectation of a professional remodeling company.
25. As Caleb, I want the design to persist if the page is accidentally refreshed or the browser is closed and reopened, so that we don't lose the homeowner's selections mid-appointment.
26. As Caleb, I want a "Start Over" button that clears all selections back to defaults, so that I can reset cleanly between appointments.

## Implementation Decisions

- **Stack:** Vite + React + React Three Fiber (R3F) + Tailwind CSS. No Next.js — this is a single-page static app with no routing, no SSR, and no server. Vite builds to static files deployed via GitHub → Cloudflare Pages.

- **Asset hosting:** All GLB model files and PNG/JPG texture images are bundled locally in the repo (`/public/models/` and `/public/textures/`). Zero external requests after initial page load. This eliminates the BCI lag problem by design.

- **Pre-caching:** All GLB models and textures are loaded via a Suspense boundary and `useLoader` on app launch, not on demand. Selections trigger visibility toggles and material swaps on already-loaded assets — not new network requests.

- **3D scene structure:** A single persistent Three.js canvas. The environment (walls, floor, ceiling) is always visible. The base unit (tub or shower) is swapped by toggling model visibility. Add-ons (seat, shelf, enclosure, trim) are independent layers with visibility controlled by selection state.

- **Texture swapping:** Wall panels use a single GLB mesh with a swappable material. Color selection replaces the material's base texture with the selected color swatch image. Pattern selection composites a transparent PNG overlay onto the base color using a canvas blend or a second material layer.

- **Manifest:** `products-manifest.json` is the single source of truth. It defines every selectable option: label, thumbnail image path, model file or texture file reference, and a stubbed `price` field (not displayed in MVP, reserved for Phase 2).

- **Selection state:** A single `selections` object (7 keys, one per category). Updated via `useState` or `useReducer`. The 3D scene reads from this object reactively. No external state library needed for MVP.

- **Tab navigation:** Two-tier tab structure matching WestShore Home's layout. Top of panel: main area tabs (Bath Area | Vanity | Flooring | Toilet) — only "Bath Area" is active in MVP, others are visible but disabled as placeholders for Phase 2. Bottom of panel: 7 sub-category tabs (Base | Walls | Pattern | Trim | Enclosure | Seat | Shelf) — always visible, always tappable. An `activeTab` state variable controls which sub-category's options fill the panel body between the two tab rows. No wizard steps, no "next" button required.

- **Design persistence:** The `selections` object is written to `localStorage` on every state change. On app load, if a saved design exists in localStorage, it is restored automatically — no account needed. This means accidental refreshes or tab closes don't lose the homeowner's design. A "Start Over" button clears localStorage and resets to defaults.

- **Summary screen:** A separate view (toggle via a `showSummary` boolean state). Renders all 7 selections as label + thumbnail cards. "Back to Design" button returns to the configurator.

- **Layout:** Tailwind CSS grid or flex layout. 3D canvas: ~75% width. Selection panel: ~25% width, scrollable. App targets tablet landscape orientation for in-home appointments.

- **Deployment:** GitHub repo → Cloudflare Pages free tier. Auto-deploys on push to main. No build environment variables needed for MVP.

- **No backend, no auth, no analytics** for MVP.

## Testing Decisions

For MVP, this app has no backend, no API, and no complex business logic — formal unit/integration test suites are not required at launch. The primary quality signal is: **does the 3D scene correctly reflect the current selection state?**

What makes a good test for this app:
- Tests verify *external behavior* (what the user sees), not implementation details (which Three.js method was called)
- A selection change should be testable by asserting which model/material is active, not by inspecting internal React component state

Modules to verify manually before each deployment:
1. **Manifest integrity** — every option in `products-manifest.json` references a file that actually exists in `/public/`
2. **Base type swap** — switching Tub ↔ Shower changes the correct model visibility
3. **Wall color swap** — selecting any color applies the correct texture to the panel mesh
4. **Pattern overlay** — selecting a laser etch pattern composites correctly over the current base color; deselecting removes it
5. **Fixture color** — trim/valve models update to the selected finish
6. **Add-on visibility** — seat and shelf models appear/disappear correctly; "None" clears the model
7. **Tab navigation** — selecting any tab shows its options; previous selections persist when switching tabs
8. **Summary screen** — all 7 current selections are displayed correctly

A simple manifest validation script (`node scripts/validate-manifest.js`) that checks every file reference in the JSON exists on disk is the highest-value automated check for this codebase.

## Out of Scope

- **Live pricing display** — price field is stubbed in the manifest but not shown. Pricing requires the V2 cost catalog to be finalized and confirmed by Sergey first.
- **JobTread integration** — direct-write to JobTread via MCP is designed and tested in the estimating workflow but not connected to this app yet. Phase 2.
- **Vanity, Flooring, Toilet tabs** — Elite does not sell these as standalone products in the acrylic surround package.
- **Walk-in tub configurations** — separate product line, deferred.
- **Plumbing location (left/right)** — install detail, not a design decision the homeowner makes.
- **Shower head type selection** — not a decision point in Elite's current sales process.
- **Tile option** — future product line addition; acrylic surrounds only for MVP.
- **Portrait/mobile layout** — app is designed for tablet landscape at an in-home appointment.
- **User accounts, save/load designs, sharing** — no backend for MVP.
- **Analytics or session tracking.**

## Further Notes

- **Asset source:** GLB models and texture images were extracted from the BCI/Epigraph WebGL stream. As a licensed BCI dealer, Elite has access to these assets via the dealer platform. The dealer agreement should be reviewed before this app is shown publicly or shared outside of internal sales use.
- **Pricing (Phase 2):** When pricing is added, it will pull from `bathroom-cost-reference.md` in the Elite Estimating vault. The V2 cost catalog maps directly to the selections in this app. Each selection's `price` field in the manifest will be populated at that time.
- **JobTread (Phase 2):** The JT MCP direct-write path (`createCostGroup` with nested `lineItems`) is already designed, documented, and live-tested. Wiring the summary screen to push a complete estimate to a JobTread job is a well-defined next step once MVP is stable.
- **App location:** Code lives at `~/2nd_Brain/App-Development/3d-design-app/` — sibling to the vault, not inside it. Separate git repo, separate Cloudflare deployment.
