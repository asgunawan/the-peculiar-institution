# Session Context — Handoff Document
**Last updated: 2026-05-24 | HEAD: `beb21ea`**

This file exists so a new chat session (or a different machine) can pick up context quickly.
Delete or overwrite it when it goes stale.

---

## What was built in the last session

### 1. Educational design philosophy doc
`docs/educational-game-design.md` — "mechanics ARE the lesson" philosophy. Oregon Trail / CK2
comparisons, three design layers (mechanics / period voice / optional almanac notes), table
mapping each mechanic to its lesson, what to avoid (pop-up facts, quizzes).

### 2. Soil depletion overhaul (biggest change)
**Problem:** maintenance workers restored soil every season → +20/yr per worker vs −15/yr from
harvest → one worker permanently neutralized depletion → soil never died → wrong and boring.

**Fix:**
- Maintenance soil restoration → **Winter only** (`SOIL_RESTORE_PER_WORKER = 4`)
- **Passive fallow recovery**: +3/season on idle fallow plots (`FALLOW_RECOVERY_PER_SEASON = 3`)
- **Fallow recovery cap**: 75% (`FALLOW_RECOVERY_CAP = 75`) — tobacco-exhausted land never fully
  recovers. This is historically accurate: Virginia planters had almost no soil remediation tools
  in 1780. The dominant response was westward expansion.

### 3. "Set to Rest" plot toggle
Fallow plots show a "Set to Rest / Return to Rotation" button in LandPanel. Spring planting skips
resting plots (`plot.resting = true`). Soil bar shows "+3/season" recovery hint. Resting rows
render at 75% opacity with a "Resting" badge.

### 4. Hire-out income for idle workers
Growing-season maintenance workers now earn `HIREOUT_INCOME_PER_WORKER = 3` ($/worker/season).
Logged as "N workers hired out to neighboring farms. $X received."
- Historically accurate: Jefferson, Washington, Fitzhugh all hired out surplus enslaved workers.
  Unskilled hire-out was ~$30–50/year in 1780s Virginia.
- Conservative rate: idle workers are marginally profitable but never worth buying purely for
  hire-out (upkeep $7/winter vs $9/yr from hire-out in 3 growing seasons).
- Winter maintenance unchanged: soil restoration only, no hire-out.

---

## Current codebase status

- **Tests:** 15/15 passing (vitest). `npm run test`
- **Lint/build:** clean
- **Workers:** `state.workers` is `[{id, type:"enslaved"|"free"}]` array, NOT an integer.
  `totalWorkers`, `enslavedCount`, `freeCount` computed once at top of App.jsx render.

### Key constants (src/gameLogic/constants.js)
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
```

### Known test coverage gaps
- No test for Spring resting-plot skip behavior
- No tests for tending / harvesting / curing yield math
- No integration test for a full game year
- No tests for plot purchase or worker buy/dismiss flows

---

## Next priorities (user-stated order)

### 1. Human playtest
Play the game. Focus on:
- Does soil pressure feel real by year 4–5 on a 1-plot 4-worker start?
- Is the fallow cap (75%) frustrating or interesting?
- Do hire-out earnings feel meaningful or ignorable?

### 2. Slave infrastructure system
**Read `docs/infrastructure-brainstorm.md` before touching any code.**
Design doc covers a 6-tier system:
- Slave quarter cabins (housing cap on worker count)
- Tobacco barn (curing/storage capacity)
- Driver system (enslaved supervisor, productivity bonus)
- Overseer house (paid white overseer, larger workforce capacity)
- Provision grounds (reduces upkeep cost)
- Smithy / cooperage (tool maintenance, TBD)

Key historical constraints to preserve:
- Cannot hold more workers than you have cabin capacity for
- Gang labor efficiency degrades above ~8–10 workers without a driver/overseer
- Infrastructure is built in Winter by the workforce (labor cost, not just money)

### 3. Review remaining docs
- `docs/tobacco-technology-brainstorm.md` — likely has mechanic ideas
- `docs/story-and-setting.md` — narrative/framing ideas
- `concept.txt` (repo root) — original design research

---

## Conventions reminder
- All prices in **cents/pound**. Convert ÷100 only at display/sell time.
- `assignments` reset to 0 by `resolveSeason` after each season.
- Raw tobacco rots if not cured in Winter.
- Soil health clamps 0–100.
- Log entries: `{ id, text }`, newest first, max 20.
- Money: `parseFloat((n).toFixed(2))` to avoid float drift.
- Read `docs/history.md` before changing any constant in constants.js.
- Read `.github/instructions/gamelogic.instructions.md` before touching `src/gameLogic/`.
