# The Peculiar Institution

**Current version: 0.1 — MVP complete.**
The base tobacco farming loop (plant → tend → harvest → cure → sell, soil pressure, worker upkeep, debt foreclosure) is fully playable.
See `concept.txt` for the full design vision and feature roadmap toward 1.0.

## Quick Start

```bash
cd the-peculiar-institution
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Scripts

```bash
npm run dev         # local development
npm run build       # production build
npm run lint        # eslint
npm run test        # vitest (run once)
npm run test:watch  # vitest watch mode
```

## Gameplay Loop

Each year has 4 seasons. Each season you:
1. Assign workers to currently available tasks.
2. Click Advance Season to resolve outcomes.

| Season | Available tasks |
|--------|------------------|
| Spring | Planting + Maintenance |
| Summer | Tending + Maintenance |
| Fall   | Harvesting + Maintenance |
| Winter | Curing + Maintenance |

Core pressures:
- Soil health degrades from tobacco harvests and recovers through maintenance.
- Raw tobacco must be cured in Winter or it rots.
- Worker upkeep creates recurring debt pressure.

Win/Lose conditions:
- Victory triggers when advancing out of Winter 1792 into 1793.
- Foreclosure triggers after repeated debt seasons when no sellable inventory remains.

## Season Outlook Panel

The UI includes a Season Outlook panel that previews:
- Debt risk on the next advance.
- Winter curing shortfall risk (in Fall/Winter windows).

This is a read-only forecast aid; it does not mutate game state.

## Architecture

```text
src/
  hooks/
    useGameSession.js
    useMarketActions.js
    useSeasonAdvance.js
    useToastNotifications.js
  gameLogic/
    constants.js
    initialState.js
    logUtils.js
    seasonEngine.js
    seasonEngine.test.js
    taskHints.js
  components/
    ErrorBoundary.jsx
    EventLog.jsx
    GameHeader.jsx
    LandPanel.jsx
    MarketPanel.jsx
    ResourcePanel.jsx
    SeasonOutlookPanel.jsx
    WorkforcePanel.jsx
  App.jsx
```

## Canonical State Shape

```js
{
  year: 1780,
  seasonIndex: 0, // 0=Spring 1=Summer 2=Fall 3=Winter
  money: 500,
  workers: 4,
  plots: [{
    id: 1,
    name: "Home Field",
    soilHealth: 100,
    cropType: "tobacco",
    state: "fallow", // fallow | planted | tended
    yieldModifier: 1.0,
  }],
  resources: { rawTobacco: 0, curedTobacco: 0 },
  assignments: {
    planting: 0,
    tending: 0,
    harvesting: 0,
    curing: 0,
    maintenance: 0,
  },
  maintenanceTarget: 0, // remembered maintenance preference
  debtSeasons: 0,
  log: [{ id: 1, text: "..." }],
  logCounter: 2,
  gameOver: false,
  victory: false,
}
```

Assignment behavior:
- Assignments are preserved as player preference memory across seasons.
- Active tasks are clamped so total assignment cannot exceed worker count.

## Current Balance Pass (May 2026)

Goals:
- Keep historical tobacco pricing in low single-digit cents per pound.
- Maintain debt as recurring pressure, not instant collapse.
- Preserve one realistic recovery window after a bad season.

Applied change:
- Debt foreclosure window is tuned to 3 consecutive debt seasons (with no inventory) before game over.

## Historical Baseline

Before changing numeric tuning in game logic, read docs/history.md.

Accuracy rule:
- Research first for any new mechanic (overseer system, market mechanics, cotton chain, etc.).
- Keep gameplay-scaled constants documented with short rationale comments.
