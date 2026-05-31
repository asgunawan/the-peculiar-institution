# Session Context — Handoff Document
**Last updated: 2026-06-01 | HEAD: (commit pending)**

This file exists so a new chat session (or a different machine) can pick up context quickly.
Delete or overwrite it when it goes stale.

---

## What was built across recent sessions

### Session N-3 (soil / fallow / hire-out)
1. **Educational design philosophy doc** — `docs/educational-game-design.md`
2. **Soil depletion overhaul** — maintenance restore → Winter only (`SOIL_RESTORE_PER_WORKER = 4`),
   passive fallow recovery `+3/season` capped at 75% (`FALLOW_RECOVERY_CAP = 75`).
3. **"Set to Rest" plot toggle** — LandPanel button, Spring skips resting plots, "+3/season" hint in soil bar.
4. **Hire-out income** — maintenance workers in growing seasons earn `HIREOUT_INCOME_PER_WORKER = 3` $/season.

### Session N-2 (TypeScript migration + run logger)
5. **Full TypeScript migration** — all `.js`/`.jsx` → `.ts`/`.tsx`. Strict mode. 63 tests green.
6. **Run log initial state snapshot** — `logInitialState()` records `{ seq: -1, label: "START" }` at game start and on new game.

### Session N-1 (UI narrative overhaul)
7. **Random events system** (5 events, `applyEvents=false` flag prevents firing during preview):
   - `tobacco-blight` (Summer, 12%) — tending gains partially undone
   - `drought` (Summer, 10%) — soil worsened
   - `early-frost` (Fall, 12%) — harvest loss
   - `price-crash` (any, 8%) — `priceModifier` applied to sell price that season
   - `good-harvest` (Summer, 12%) — yield bonus
8. **Header subtitle ticker** — replaces static season hint + separate flavor banner:
   - Priority 1: `state.pendingFlavorText` (events, debt, year notes) — shows in accent italic with `×` dismiss
   - Priority 2: Season hint shown **once per season type** (tracked in `seenMilestones` as `hint-Spring` etc.)
   - Priority 3: `FLAVOR_POOL` (20 rotating historical facts), deterministic by `(year * 4 + seasonIndex)`
9. **Year-triggered milestones** — historical notes for 1780–1792 fire entering each new year's Spring.
   Game starts with the 1780 note pre-set in `initialState`.
10. **Hover-reveal side menu** — `💾` tab peeks 36px at left edge; full 270px panel slides in on hover,
    stays expanded when `[open]`. CSS-only (`transition: left 0.22s`).
11. **`EVENT_HEADER_TEXT`** — short 1-line header summaries per event id (separate from full log text).

### Session N (this session — Slave Infrastructure: Tiers 2/3/4)
12. **`Building` type + `buildings: Building[]` on GameState** — `types.ts` extended with `BuildingType = "quarter_cabin" | "tool_shed"` and `Building { id, type, builtYear }`.
13. **`CropType = "tobacco" | "provision"`** — plots can now be permanently converted to Provision Grounds.
14. **Quarter Cabin Row ($60)** — buy in Market; adds 6 housing capacity. Base capacity = 6 (no cabin needed at start).
    `handleBuyWorker` is gated: blocks purchase if `enslavedCount >= housingCapacity`.
    Market row shows live "Housing: N / M" counter.
15. **Provision Grounds** — convert any fallow tobacco plot (requires ≥2 tobacco plots). Plot `cropType` changes to `"provision"`.
    Winter upkeep drops from `$7 → $4/worker/season` (`PROVISION_UPKEEP_PER_WORKER = 4`).
    Provision plots are excluded from planting/harvesting. LandPanel shows green "Provision Grounds" bar.
    Guard: button hidden when only 1 tobacco plot remains.
16. **Tool Cache ($80, one-time)** — +10% Fall harvest yield (`TOOL_SHED_YIELD_BONUS = 0.10`).
    Market shows "Owned ✓" (disabled) once purchased.
17. **Infrastructure section in MarketPanel** — below a divider + `<h3>Infrastructure</h3>`, two rows for Cabin and Tool Cache.
18. **`saveNormalizer.ts` updated** — migrates old saves: `buildings` defaults to `[]`, `cropType` defaults to `"tobacco"`.
19. **67 tests green** — 4 new tests: provision upkeep, tool shed yield, no-provision baseline, Spring skips provision plots.

---

## Current codebase status

- **Stack:** React 19 + Vite, TypeScript strict, Vitest, plain CSS
- **Tests:** 67/67 passing (`npm run test`)
- **Lint/typecheck:** clean (`npm run lint`, `npm run typecheck`)
- **Dev server:** `npm run dev` → `localhost:5173`

### Key files
| File | Purpose |
|---|---|
| `src/gameLogic/constants.ts` | ALL tuning values, `SEASON_HINTS`, `FLAVOR_MILESTONES`, `EVENT_HEADER_TEXT`, `FLAVOR_POOL`, infrastructure constants |
| `src/gameLogic/types.ts` | `GameState` interface — includes `buildings: Building[]`, `CropType`, `BuildingType` |
| `src/gameLogic/seasonEngine.ts` | `resolveSeason(state, applyEvents=true)` — pure. Provision upkeep, tool shed bonus, provision plot skipping. |
| `src/gameLogic/initialState.ts` | `createInitialState()` — `buildings: []` included |
| `src/gameLogic/saveNormalizer.ts` | Normalizes old saves — backfills `buildings: []`, `cropType: "tobacco"` |
| `src/gameLogic/runLogger.ts` | `logInitialState()`, `downloadLog()`, `getLog()` |
| `src/hooks/useGameSession.ts` | State + localStorage owner |
| `src/hooks/useMarketActions.ts` | `handleBuildCabin`, `handleBuyToolShed`, `handleConvertToProvision`, housing gate on `handleBuyWorker` |
| `src/hooks/useSeasonAdvance.ts` | Applies `priceModifier` to sell price after events |
| `src/components/GameHeader.tsx` | Subtitle ticker with dismiss |
| `src/components/MarketPanel.tsx` | Infrastructure section (Cabin + Tool Cache rows), housing counter |
| `src/components/LandPanel.tsx` | Provision plot display, "→ Provision" button (hidden when ≤1 tobacco plot) |
| `src/components/SideMenu.tsx` | `<details>` hover-reveal menu with 10 save slots |
| `src/App.tsx` | Wires all hooks and components |

### Key constants (src/gameLogic/constants.ts)
```
SOIL_DEGRADE_PER_HARVEST = 20
SOIL_RESTORE_PER_WORKER = 4       (Winter only)
FALLOW_RECOVERY_PER_SEASON = 3
FALLOW_RECOVERY_CAP = 75
HIREOUT_INCOME_PER_WORKER = 3
ENSLAVED_UPKEEP_PER_SEASON = 7
ENSLAVED_PURCHASE_COST = 200
PLOT_COST = 150
BASE_YIELD_PER_PLOT = 2000
CURING_RATIO = 2
CURING_CAPACITY_PER_WORKER = 1000
WORKERS_PER_PLOT_FULL_TEND = 1.5
DEBT_FORECLOSURE_SEASONS = 3
FREE_WORKER_WAGE_PER_SEASON = 15
START_YEAR = 1780
COTTON_GIN_YEAR = 1793
BASE_HOUSING_CAPACITY = 6
CABIN_HOUSING_CAPACITY = 6
CABIN_COST = 60
TOOL_SHED_COST = 80
TOOL_SHED_YIELD_BONUS = 0.10
PROVISION_UPKEEP_PER_WORKER = 4
```

### GameState shape (canonical)
```ts
{
  year: number,            // 1780+
  seasonIndex: number,     // 0=Spring 1=Summer 2=Fall 3=Winter
  money: number,
  workers: [{ id: number, type: "enslaved"|"free" }],
  plots: [{ id, name, soilHealth, cropType: "tobacco"|"provision", state, yieldModifier, resting }],
  buildings: [{ id: number, type: "quarter_cabin"|"tool_shed", builtYear: number }],
  resources: { rawTobacco, curedTobacco },
  assignments: { planting, tending, harvesting, curing, maintenance },
  log: [{ id, text }],     // newest first, max 20
  logCounter: number,
  gameOver: boolean,
  victory: boolean,
  debtSeasons: number,
  maintenanceTarget: number,
  pendingFlavorText: string | null,
  seenMilestones: string[],   // e.g. "hint-Spring", "year-1783", "soil-low", "first-debt"
  priceModifier: number,      // resets to 1.0 each season; set <1 by price-crash event
}
```

### Known test coverage gaps
- No tests for tending / harvesting / curing yield math
- No integration test for a full game year
- No tests for plot purchase or worker buy/dismiss flows
- No tests for random event application or flavor milestone triggering

---

## Next priorities (suggested order)

### 1. Human playtest
Play the game for a full 5–7 years. Focus on:
- Does soil pressure feel real by year 4–5?
- Does the provision grounds trade-off feel meaningful?
- Is the Quarter Cabin housing gate an interesting constraint or just friction?
- Does the Tool Cache feel worth $80?
- Export a run log (`window.downloadRunLog()`) and run `python scripts/analyze_run.py <log>`.

### 2. Remaining infrastructure (if desired)
From `docs/infrastructure-brainstorm.md`:
- **Tobacco Barn** — curing/storage capacity increase (Tier 5)
- **Driver system** — enslaved supervisor, productivity bonus for large gangs (Tier 6)
- **Overseer house** — paid white overseer, larger workforce cap (post-MVP)
Cotton chain and cotton gin mechanics are explicitly **out of scope** until victory conditions are revisited.

### 3. Review remaining design docs
- `docs/tobacco-technology-brainstorm.md` — mechanic ideas
- `docs/story-and-setting.md` — narrative/framing ideas
- `concept.txt` (repo root) — original design research

---

## Conventions reminder
- All prices in **cents/pound**. Convert ÷100 only at display/sell time.
- `assignments` reset to 0 by `resolveSeason` after each season.
- Raw tobacco rots if not cured in Winter — do not carry it forward.
- Soil health clamps 0–100.
- Log entries: `{ id, text }`, newest first, max 20.
- Provision conversion is **permanent** — no undo button.
- One provision plot = full upkeep reduction. Multiple provision plots don't stack further.
- Money: `parseFloat((n).toFixed(2))` to avoid float drift.
- Read `docs/history.md` before changing any constant in `constants.ts`.
- Read `.github/instructions/gamelogic.instructions.md` before touching `src/gameLogic/`.
- All game logic in `src/gameLogic/` is **pure TypeScript — no React imports**.
- `resolveSeason(state, false)` is used for preview rendering (no events fire).
