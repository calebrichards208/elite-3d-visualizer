# Elite 3D Visualizer

In-home sales tool for Elite Construction + Remodeling. Caleb uses this on a tablet during bathroom remodel appointments. Homeowner and Caleb design together in real time — selections update the 3D bathroom render instantly.

## What this replaces
The BCI/Bath Concepts dealer configurator (Epigraph platform) — laggy, bloated, breaks over cellular. This app is self-contained, runs entirely in the browser, zero network calls after load.

## Stack
- Vite + React + React Three Fiber + Tailwind CSS
- Static files → GitHub (`calebrichards208/elite-3d-visualizer`) → Cloudflare Pages
- Live URL: https://elite-3d-visualizer.calebrichards208.workers.dev
- No backend, no auth, no database

## Key Files
- `src/data/products-manifest.json` — single source of truth. Maps every option to its GLB model or texture file. Edit this to add/remove options or update prices.
- `public/models/` — 93 GLB 3D model files
- `public/textures/` — 134 texture/thumbnail images
- `PRD.md` — full product requirements doc

## App Structure (what we're building)
Split-screen layout:
- Left ~75%: Three.js canvas — 3D bathroom render, always visible, updates on every selection
- Right ~25%: Floating selection panel
  - Top of panel: main area tabs (Bath Area active | Vanity | Flooring | Toilet — last 3 disabled in MVP)
  - Middle: thumbnail grid for the active sub-category
  - Bottom of panel: 7 sub-category tabs always visible (Base | Walls | Pattern | Trim | Enclosure | Seat | Shelf)

## 7 MVP Selection Categories
1. **Base** — Shower or Tub (swaps the base 3D model)
2. **Walls** — Solid acrylic panel color (texture swap on surround panels)
3. **Pattern** — None or laser etch overlay (transparent PNG composited over wall color)
4. **Trim** — Chrome / Brushed Nickel / Matte Black / Brushed Gold / Oil Rubbed Bronze / Stainless
5. **Enclosure** — None / Curtain Rod / Glass Door
6. **Seat** — None / Bench / Fold Down / Corner Seat
7. **Shelf** — None / Corner Shelf / Niche Shelf

## State
```js
// Single selections object — persisted to localStorage on every change
const selections = {
  base: "shower",       // option id
  wallColor: "white",
  wallPattern: "none",
  trim: "chrome",
  enclosure: "curtain-rod",
  seat: "none",
  shelf: "none"
}
```

## 3D Scene Architecture
- Environment models always visible: `standard_bathroom.glb`, `elite_walls.glb`, `elite_floor.glb`, `elite_baseboard.glb`, `vanity.glb`, `toilet.glb`
- Wall panels: `SHOWER-SURROUND-CENTER-ELITE.glb` + `SHOWER-SURROUND-SIDES-ELITE.glb` — texture-swapped based on wallColor + wallPattern selections
- Base unit: toggled visibility between `SHOWER-STANDARD.glb` and `TUB-CLASSIC.glb`
- Add-ons (seat, shelf, enclosure): visibility toggled on/off, model swapped based on selection

## What's NOT in MVP
- Live pricing (price fields stubbed in manifest, not displayed)
- JobTread integration (Phase 2 — MCP direct-write path already designed)
- Vanity / Flooring / Toilet tabs
- Walk-in tubs, tile option, plumbing location, shower head type

## Phase 2
- Wire `price` fields in manifest to V2 bathroom cost catalog
- Display running total in selection panel
- Summary screen → push complete estimate to JobTread via MCP

## Build Rules
- No backend, no API keys, no external calls after initial load
- localStorage for design persistence across refreshes
- All assets served from `/public/` — zero CDN dependencies
- Deploy: `git push` → Cloudflare auto-builds

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
