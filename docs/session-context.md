# Session Context — Handoff Document
**Last updated: 2026-05-29 | HEAD: `4dae466`**

This file exists so a new chat session (or a different machine) can pick up context quickly.
Delete or overwrite it when it goes stale.

---

## What was built across recent sessions

### Session N-2 (soil / fallow / hire-out)
1. **Educational design philosophy doc** — `docs/educational-game-design.md`
2. **Soil depletion overhaul** — maintenance restore → Winter only (`SOIL_RESTORE_PER_WORKER = 4`),
   passive fallow recovery `+3/season` capped at 75% (`FALLOW_RECOVERY_CAP = 75`).
3. **"Set to Rest" plot toggle** — LandPanel button, Spring skips resting plots, "+3/season" hint in soil bar.
4. **Hire-out income** — maintenance workers in growing seasons earn `HIREOUT_INCOME_PER_WORKER = 3` $/season.

### Session N-1 (TypeScript migration + run logger)
5. **Full TypeScript migration** — all `.js`/`.jsx` → `.ts`/`.tsx`. Strict mode. 63 tests green.
6. **Run log initial state snapshot** — `logInitialState()` records `{ seq: -1, label: "START" }` at game start and on new game.

### Session N (this session — UI narrative overhaul)
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

---

## Current codebase status

- **Stack:** React 19 + Vite, TypeScript strict, Vitest, plain CSS
- **Tests:** 63/63 passing (`npm run test`)
- **Lint/typecheck:** clean (`npm run lint`, `npm run typecheck`)
- **Dev server:** `npm run dev` → `localhost:5173`

### Key files
| File | Purpose |
|---|---|
| `src/gameLogic/constants.ts` | ALL tuning values, `SEASON_HINTS`, `FLAVOR_MILESTONES` (incl. year-1780–1792), `EVENT_HEADER_TEXT`, `FLAVOR_POOL` |
| `src/gameLogic/types.ts` | `GameState` interface — has `pendingFlavorText`, `seenMilestones`, `priceModifier` |
| `src/gameLogic/seasonEngine.ts` | `resolveSeason(state, applyEvents=true)` — pure. Events set `pendingFlavorText`. Year change sets year milestone. |
| `src/gameLogic/initialState.ts` | `createInitialState()` — starts with `year-1780` flavor text pre-set |
| `src/gameLogic/saveNormalizer.ts` | Normalizes old saves for `pendingFlavorText`, `seenMilestones`, `priceModifier` |
| `src/gameLogic/runLogger.ts` | `logInitialState()`, `downloadLog()`, `getLog()` |
| `src/hooks/useGameSession.ts` | State + localStorage owner. Calls `logInitialState` on start/reset. |
| `src/hooks/useSeasonAdvance.ts` | Applies `priceModifier` to sell price after events. |
| `src/components/GameHeader.tsx` | Accepts `subtitle: string` + `onDismissSubtitle?: () => void` props |
| `src/components/SideMenu.tsx` | `<details>` hover-reveal menu with 10 save slots, file export/import, new game |
| `src/App.tsx` | Computes `headerSubtitle`, wires all hooks and components |

### Key constants (src/gameLogic/constants.ts)
```
SOIL_DEGRADE_PER_HARVEST = 15
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
```

### GameState shape (canonical)
```ts
{
  year: number,            // 1780+
  seasonIndex: number,     // 0=Spring 1=Summer 2=Fall 3=Winter
  money: number,
  workers: [{ id: number, type: "enslaved"|"free" }],
  plots: [{ id, name, soilHealth, cropType, state, yieldModifier, resting }],
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
- No test for Spring resting-plot skip behavior
- No tests for tending / harvesting / curing yield math
- No integration test for a full game year
- No tests for plot purchase or worker buy/dismiss flows
- No tests for random event application or flavor milestone triggering

---

## Next priorities (suggested order)

### 1. Human playtest
Play the game for a full 5–7 years. Focus on:
- Does soil pressure feel real by year 4–5?
- Do random events feel surprising or annoying?
- Is the fallow cap (75%) frustrating or interesting?
- Does the flavor ticker add atmosphere or just noise?
- Export a run log (`window.downloadRunLog()`) and run `python scripts/analyze_run.py <log>`.

### 2. Slave infrastructure system
**Read `docs/infrastructure-brainstorm.md` before touching any code.**
Design doc covers a 6-tier system:
- Slave quarter cabins (housing cap on worker count)
- Tobacco barn (curing/storage capacity)
- Driver system (enslaved supervisor, productivity bonus)
- Overseer house (paid white overseer, larger workforce capacity)
- Provision grounds (reduces upkeep cost)

Key historical constraints to preserve:
- Cannot hold more workers than you have cabin capacity
- Gang labor efficiency degrades above ~8–10 workers without a driver/overseer
- Infrastructure built in Winter by the workforce (labor cost + money)

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
- Money: `parseFloat((n).toFixed(2))` to avoid float drift.
- Read `docs/history.md` before changing any constant in `constants.ts`.
- Read `.github/instructions/gamelogic.instructions.md` before touching `src/gameLogic/`.
- All game logic in `src/gameLogic/` is **pure TypeScript — no React imports**.
- `resolveSeason(state, false)` is used for preview rendering (no events fire).
