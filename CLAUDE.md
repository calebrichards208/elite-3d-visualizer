# Elite 3D Visualizer

In-home sales tool for Elite Construction + Remodeling. Caleb uses this on a tablet during bathroom remodel appointments. Homeowner and Caleb design together in real time — selections update the 3D bathroom render instantly.

## What this replaces
The BCI/Bath Concepts dealer configurator (Epigraph platform) — laggy, bloated, breaks over cellular. This app is self-contained, runs entirely in the browser, zero network calls after load.

## Stack
- Vite 8 + React 19 + React Three Fiber v9 + Tailwind CSS v4
- Static files → GitHub (`calebrichards208/elite-3d-visualizer`) → Cloudflare auto-build
- Live URL: https://elite-3d-visualizer.calebrichards208.workers.dev
- Dev server: `npm run dev -- --port 5175`
- No backend, no auth, no database

## Deployment
- GitHub push to `master` → Cloudflare auto-builds and deploys
- There are TWO Cloudflare projects. The real one is the `.workers.dev` URL (GitHub connected). Ignore the `.pages.dev` one — it's an orphan from an old wrangler CLI deploy.
- Build command: `npm run build` / Output dir: `dist`

## Key Files
- `src/components/BathroomScene.jsx` — entire 3D scene, camera, nudge tool, all model rendering
- `src/components/SelectionPanel.jsx` — right-side UI panel, tabs, thumbnails
- `src/data/products-manifest.json` — single source of truth for all options, models, textures
- `src/utils/loadBasisTexture.js` — BasisTextureLoader wrapper for `.basis` wall/seat textures
- `public/models/` — all GLB 3D model files
- `public/textures/` — all texture and thumbnail images

## 8 MVP Selection Categories
1. **Base** — Shower (`SHOWER-STANDARD.glb`) or Tub (`TUB-CLASSIC.glb`)
2. **Walls** — 22 Elite dealer colors via `.basis` textures on `SHOWER-SURROUND-CENTER-ELITE.glb` + `SHOWER-SURROUND-SIDES-ELITE.glb`
3. **Trim** — Chrome / Brushed Nickel / Matte Black / Brushed Gold / Oil Rubbed Bronze / Stainless
4. **Enclosure** — None / Curtain Rod / Clear Glass Door / Rain Glass Door
5. **Shower Head** — Rain Head / Handheld (auto-switches to tub fixtures when tub selected)
6. **Grab Bars** — None / Grab Bar Set
7. **Seat** — None / Bench / Fold Down / Corner Seat
8. **Shelf** — None / Corner Shelf / Niche Shelf

## Hardcoded Positions (confirmed via nudge tool)
```
SHOWER_WET_POS   = [-1.683, 0.000,  1.344]
TUB_WET_POS      = [-1.683, 0.000,  1.444]
ACC_POS          = [-1.683, 0.000,  1.394]   // curtain rod
VALVE_POS        = [-1.883, 0.000,  1.444]
RAIN_HEAD_POS    = [-1.883, 0.100,  1.444]
HANDHELD_POS     = [-1.883, 0.250,  1.244]
TUB_HEAD_POS     = [-1.883, 0.000,  1.444]
SEAT_POS         = [-1.683, 0.000,  1.344]
FOLD_DOWN_POS    = [-2.633, 0.400, -0.256]
DRAIN_POS        = [-1.823, 0.000,  1.474]   // confirmed visually
STD_DOOR_POS     = [-1.683, 0.000,  1.394]
STD_GLASS_POS    = [-2.033, 1.200, -0.006]
GRAB_BAR_VERT_POS  = [-2.233, -0.050, 1.544]
GRAB_BAR_DIAG_POS  = [-0.433,  1.100, 1.194]
```
All groups use `rotation={[0, Math.PI/2, 0]}` unless noted.

## Wall Texture System
- Walls use `.basis` files loaded via `BasisTextureLoader` from `three-stdlib`
- Loader: `src/utils/loadBasisTexture.js` — accepts `(url, gl)` where `gl` comes from `useThree()`
- Wall GLBs are PlayCanvas-generated with Draco compression and NO embedded materials — textures applied programmatically in `WallPanels` component
- Some colors still fall back to hex (Arctic Ice, Tuscany, Versailles, Carbon Ash) — correct `.basis` files not yet downloaded
- To get missing basis files: open Bath Concepts Epigraph designer in Chrome → DevTools Network tab → filter `.basis` → click each color → download

## Seat GLB Quirks — Important
- `BENCH-SHOWER-SEAT.glb` and `HEXAGONAL-CORNER-SEAT.glb` each contain TWO mirrored seats (one per side wall of the shower). They must NOT be rendered with `OptionalModel` directly — use `LeftSeatModel` which clones the scene, computes geometry centroids (not node positions, which are all 0,0,0), and hides the far-side meshes.
- `MOEN_BENCH_2.glb` (fold-down seat) has NO embedded materials — renders blank/gray if used directly. Use `FoldDownSeat` component which clones and applies the teak basis texture (`MOEN_TEAK_BENCH_Silver_Teak.basis`).
- `LeftSeatModel` uses geometry bounding box centroids via `setFromBufferAttribute` — NOT `getWorldPosition()` — because node positions are all identity in these GLBs.

## Trim Color System
Materials defined in `TRIM_PROPS` constant. Applied via `TrimColoredModel` component which clones the GLB scene and sets `MeshStandardMaterial` on all meshes. Applies to: valve, rain head, handheld, tub fixtures, curtain rod, grab bars, glass door frame, corner shelf, shower drain.

## Shower Drain
- `SHOWER-DRAIN.glb` rendered as `TrimColoredModel` at `DRAIN_POS`
- Only visible when `base !== 'tub'`
- Drain cover color matches selected trim finish

## Camera / Orbit
- `CameraRig` component inside `SceneContent`
- Orbit pivot = bounding box center of `SHOWER-SURROUND-CENTER-ELITE.glb` + z offset of `+0.35` to shift pivot forward from back wall toward shower pan center
- Mobile camera: `z + 5.5` offset (zoomed out more than desktop `z + 4`)
- `maxPolarAngle={Math.PI/2}` — can't look from below
- `enablePan={false}` — pan disabled intentionally to keep tablet UX simple

## Nudge Tool (dev only)
- Toggle with ⚙ button (top-left, always visible in dev)
- Click a group button OR press number key to select group
- Arrow keys = move X/Z (0.05 step), W/S = move Y, Shift+any = fine mode (0.01 step)
- Q/E/R/F/T/G = rotate grab bars
- Enter = copy all confirmed positions to clipboard
- Groups: Base · Valve · Curtain Rod · Seats · Heads · GB Back · GB Entry · Std Door · Drain
- DO NOT add/remove nudge groups unless explicitly asked to reposition something

## Vanity / Flooring / Toilet Tabs
Hidden in `SelectionPanel.jsx` via `.filter(tab => tab.enabled)`. To re-enable a tab when it's built, change `enabled: false` to `enabled: true` in the `MAIN_TABS` array.

## Wall Pattern Etching — WIP ⚠️
Approach: white alpha overlay mesh (`MeshBasicMaterial` + `alphaMap` + `alphaTest: 0.5`) rendered on top of the wall color. Two separate materials for center vs sides to give independent UV control (sides offset by 0.5).

**What's working:** bayview, chevron, flagstone, herringbone, hopscotch, panorama, roman block (7 of 12 have alpha files)

**Still needs fixing:**
- Pattern scale/repeat tuning — needs more testing per-pattern
- Seam between back wall and side walls still not perfect — panels share continuous UV so offset hack is imperfect
- On light wall colors, white lines are visible but should be subtle (same-color groove effect like BCI)
- Missing alpha files: monument, oblong, scalloped, subway, hexagon (have `_normal.basis` but wrong format for this approach)
- Cobblestone missing entirely

**Key insight from BCI comparison:** BCI renders etching as a same-color groove/relief (normal map) on light panels, and shows white lines on dark panels. Our white overlay is always visible regardless of wall color — this is the fundamental approach difference to revisit.

**Files:** All etch textures in `public/textures/etch_*`. `_alpha.basis` / `_alpha.png` = overlay files. `_normal.basis` = normal maps (downloaded but not currently used).

## Glass Door
- `SH-STD-GLASS.glb` = glass panel (same mesh for clear and rain)
- `SHOWER-DOOR-STD.glb` = door frame (trim-colored)
- Clear: `MeshStandardMaterial` opacity 0.22, roughness 0.05
- Rain: same + `rain_normal.basis` normal map at scale 3.0, opacity 0.55

## Phase 2
- Wire `price` fields in manifest to V2 bathroom cost catalog
- Display running total in selection panel
- Summary screen → push complete estimate to JobTread via MCP

## Build Rules
- No backend, no API keys, no external calls after initial load
- localStorage for design persistence across refreshes
- All assets served from `/public/` — zero CDN dependencies

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
