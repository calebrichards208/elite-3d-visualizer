# Elite 3D Visualizer

In-home sales tool for Elite Construction + Remodeling. Caleb uses on tablet/phone during appointments, or sends link to customer for self-service. Homeowner and Caleb design together in real time.

## What this replaces
The BCI/Bath Concepts dealer configurator (Epigraph platform) — laggy, bloated, breaks over cellular. Self-contained, zero network calls after load.

## Stack
- Vite 8 + React 19 + React Three Fiber v9 + Tailwind CSS v4
- Static files → GitHub (`calebrichards208/elite-3d-visualizer`) → Cloudflare auto-build
- Live URL: https://elite-3d-visualizer.calebrichards208.workers.dev
- Dev server: `npm run dev -- --port 5175`
- No backend, no auth, no database

## Deployment
- GitHub push to `master` → Cloudflare auto-builds and deploys
- TWO Cloudflare projects exist. Real one is `.workers.dev` (GitHub connected). Ignore `.pages.dev`.
- Build command: `npm run build` / Output dir: `dist`

## Key Files
- `src/components/BathroomScene.jsx` — entire 3D scene, camera, nudge tool, all model rendering, export button + screenshot logic
- `src/components/SelectionPanel.jsx` — bottom UI panel, tabs, thumbnails, dimmed/disabled logic
- `src/components/ExportModal.jsx` — export modal (Save Card, Copy Summary, Copy Link)
- `src/data/products-manifest.json` — single source of truth for all options, models, textures
- `src/hooks/useSelections.js` — selection state, compatibility rules, URL param import
- `src/utils/loadBasisTexture.js` — BasisTextureLoader wrapper for `.basis` textures
- `public/models/` — all GLB 3D model files
- `public/textures/` — all texture and thumbnail images

## Default Design (manifest defaults)
Santorini White + Match Walls base + Matte Black trim + Curtain Rod. Chosen for best first impression on cinematic intro zoom.

## Selection Categories (9 active)
1. **Base** — Shower / Tub (label is "Tub", NOT "Tub Conversion")
2. **Base Color** — Match Walls / White / Almond / Biscuit / Gray / Sandbar. Match Walls loads wall basis texture on shower pan (solid, no etching). Falls back to white for horizon-beige/matte-white. Match Walls + all non-none seats greyed/disabled when tub active.
3. **Walls** — 22 Elite dealer colors. Order: plain solids first (White→Sandbar), then premium textures (Santorini White, Tuscany, Versailles, Sierra Sand, White Travertine, Napoli Marble, Glacier Ice, Carbon Ash, Arctic Ice), then the rest.
4. **Trim** — 4 options: Chrome / Brushed Nickel / Matte Black / Oil Rubbed Bronze
5. **Enclosure** — None / Curtain Rod / Clear Glass Door / Privacy Glass Door
6. **Shower Head** — Standard / Rain Head / Handheld. Rain + Handheld greyed/disabled when tub active.
7. **Grab Bars** — None / Grab Bar Set
8. **Seat** — None / Bench / Fold Down / Corner Seat. All non-none seats greyed/disabled when tub active. Auto-clears to none when switching to tub.
9. **Shelf** — None / Corner Shelf / Niche Shelf

## Compatibility Rules (src/hooks/useSelections.js)
- base → tub: seat auto-clears to 'none' if bench/corner/fold-down was active
- SelectionPanel `dimmed` logic: seats (non-none) + rain/handheld + match-walls all disabled when tub active

## Export Feature
- **Export button**: top-right, 36px dark circle with SVG share icon, always visible against scene
- **ExportModal**: screenshot + 9-row selection summary + 3 action buttons
  - **Save Card**: composite JPEG — 800px wide, cover-cropped render (80% height cap, white fill for transparent WebGL pixels) + gold bar + Elite branding + selection rows (16px font). Download.
  - **Copy Summary**: human-readable text to clipboard, shows "Copied ✓" for 2s
  - **Copy Link**: base64-encoded selections in `?d=` URL param to clipboard. Anyone opening that link loads the exact design.
- **URL import**: `useSelections.js` reads `?d=` on load, merges with defaults, cleans URL
- **Screenshot camera**: desktop `z+4.0`, mobile `z+6.25` (portrait canvas needs more zoom-out)
- `preserveDrawingBuffer: true` on Canvas required for screenshot capture

## Intro Animation (first load only)
- Camera starts at `z+9`, lerps to landing at 0.035/frame
- Panel slides up (spring easing) when zoom is ~70% complete
- sessionStorage flag `elite-intro-played`: if set, skip animation entirely
- OrbitControls disabled during zoom

## Nudge Tool (dev only)
- **Hidden when inactive** — gear button `opacity:0, cursor:default`. Caleb taps top-left corner to activate. Invisible to customers.
- Groups: Base · Valve · Curtain Rod · Seats · Fold Down · Heads · GB Back · GB Entry · Std Door · Tub Pull · Drain · Mirror
- Arrow keys = X/Z (0.05), W/S = Y, Shift = fine (0.01), Q/E/R/F/T/G = rotate grab bars
- Enter = copy all positions to clipboard
- DO NOT add/remove nudge groups unless explicitly asked to reposition something

## Hardcoded Positions (confirmed via nudge tool)
```
SHOWER_WET_POS   = [-1.683, 0.000,  1.344]
TUB_WET_POS      = [-1.683, 0.000,  1.354]
ACC_POS          = [-1.683, 0.000,  1.394]   // curtain rod
VALVE_POS        = [-1.883, 0.000,  1.444]
RAIN_HEAD_POS    = [-1.883, 0.100,  1.444]
HANDHELD_POS     = [-1.883, 0.250,  1.244]
TUB_HEAD_POS     = [-1.883, 0.000,  1.444]
SEAT_POS         = [-1.683, 0.000,  1.344]
FOLD_DOWN_POS    = [-2.623, 0.400, -0.206]
DRAIN_POS        = [-1.823, 0.000,  1.474]
STD_DOOR_POS     = [-1.678, 0.000,  1.364]   // shower door frame
STD_GLASS_POS    = [-2.028, 1.200, -0.036]   // shower glass panel
TUB_DOOR_POS     = [-1.998, 1.210, -0.096]   // tub door frame + glass
TUB_PULL_POS     = [-1.978, 1.130, -0.096]   // tub horizontal ladder pulls
GRAB_BAR_VERT_POS  = [-2.233, -0.050, 1.544]
GRAB_BAR_VERT_EULER = [0.50π, 0.33π, -0.50π]
GRAB_BAR_DIAG_POS  = [-0.433,  1.100, 1.194]
GRAB_BAR_DIAG_EULER = [0.50π, 0.00π, -1.00π]
```
All groups use `rotation={[0, Math.PI/2, 0]}` unless noted.

## Camera / Orbit
- Pivot = bounding box center of `SHOWER-SURROUND-CENTER-ELITE.glb` + z offset `+0.35`
- Default browsing: desktop `z+3.0`, mobile `z+4.4`
- Screenshot position: desktop `z+4.0`, mobile `z+6.25`
- `maxPolarAngle={Math.PI/2}`, `enablePan={false}`

## Glass Door — Tub-Aware
- base=shower: `SHOWER-DOOR-STD.glb` + `SH-STD-GLASS.glb` at STD_DOOR_POS/STD_GLASS_POS
- base=tub: `TB-GE-ENCLOSURE.glb` + `TB-STD-GLASS.glb` at TUB_DOOR_POS; pulls `SD-Horizontal_Ladder_Pulls.glb` at TUB_PULL_POS
- `TB-GE-ENCLOSURE.glb` / `SH-GE-ENCLOSURE.glb` renamed from `*G%2BE*` (URL decode issue)

## Wall Texture System
- `.basis` files via `BasisTextureLoader`. Loader: `src/utils/loadBasisTexture.js`
- Wall GLBs are PlayCanvas-generated with Draco compression, NO embedded materials
- Missing correct basis files: Arctic Ice, Tuscany, Versailles, Carbon Ash
- To get: Bath Concepts Epigraph designer → Chrome DevTools Network → filter `.basis` → download

## Base Color — Match Walls
- `VALID_BASE_COLORS` set in BathroomScene.jsx — excludes `matte-white`, `horizon-beige`
- When match-walls active: loads wall's `basisTexture` onto shower pan at 1.5x repeat, no etching
- Tub uses solid hex only (BASE_COLOR_HEX or WALL_HEX fallback)

## Seat GLB Quirks
- `BENCH-SHOWER-SEAT.glb` + `HEXAGONAL-CORNER-SEAT.glb`: contain TWO mirrored seats. Use `LeftSeatModel` (geometry centroid crop, not node positions).
- `MOEN_BENCH_2.glb` (fold-down): NO embedded materials. Use `FoldDownSeat` with `MOEN_TEAK_BENCH_Silver_Teak.basis`.

## Loading / UX
- Loading spinner: fixed DOM element OUTSIDE Canvas (`zIndex: 50`). Not inside R3F — avoids z-index overlap with SelectionPanel.
- `SceneLoaded` component (mounts inside Suspense): fires `onLoad` callback to dismiss spinner.

## Wall Pattern Etching — WIP ⚠️
7/12 patterns working (bayview, chevron, flagstone, herringbone, hopscotch, panorama, roman block).
Missing: monument, oblong, scalloped, subway, hexagon alpha files. Cobblestone missing entirely.
Files: `public/textures/etch_*`.

## Known Non-Issues
- Drain orientation: tub left-hand drain, shower head on right. Intentional non-fix.

## Phase 2
- Wire `price` fields in manifest to V2 cost catalog
- Display running total in selection panel
- Summary screen → push to JobTread via MCP

## Build Rules
- No backend, no API keys, no external calls after initial load
- localStorage for design persistence
- All assets in `/public/` — zero CDN dependencies

## ⚠️ Commit Rule — Non-Negotiable
**End every working session with a commit and push. No exceptions.**

```bash
git add src/ public/
git commit -m "short description of what changed"
git push origin master
```

This project lost a full day of work because files existed locally but were never committed.
The repo is the only backup. If it's not on GitHub, it doesn't exist.

Claude: before ending any session where code was written, run the above commands.
Do not ask — just do it as the last step of every task.
