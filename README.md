# The Peculiar Institution — MVP

A historically grounded, text-based economic simulation of the antebellum American South.  
You manage a tobacco (and later, cotton) plantation from 1780 through the invention of the cotton gin in 1793.

## Running the Game

```bash
cd plantation-game
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Architecture

```
src/
├── hooks/
│   ├── useGameSession.js   Save/load and persistent game session state.
│   ├── useMarketActions.js Buy/sell/assignment callbacks.
│   ├── useSeasonAdvance.js Season resolution + confirmation + outcome toasts.
│   └── useToastNotifications.js UI toast queue with auto-dismiss.
├── gameLogic/
│   ├── constants.js       All tuning values and historical data (prices, rates, thresholds).
│   ├── initialState.js    Factory function for a fresh gameState object.
│   ├── logUtils.js        Structured event-log helpers and normalization.
│   ├── taskHints.js       Shared task label/hint formatting helpers.
│   └── seasonEngine.js    Pure function: resolveSeason(state) → nextState.
│                          No React imports. Fully testable in isolation.
└── components/
  ├── ErrorBoundary.jsx   Crash-safe fallback UI wrapper.
    ├── GameHeader.jsx      Year, season, money display.
    ├── WorkforcePanel.jsx  Worker assignment inputs, validates sum ≤ total workers.
    ├── LandPanel.jsx       Plots with soil health bars (green/yellow/red).
    ├── ResourcePanel.jsx   Raw tobacco and cured tobacco stock.
    ├── MarketPanel.jsx     Sell cured tobacco; buy workers and land.
    └── EventLog.jsx        Text feed of last 20 season events.
  App.jsx coordinates hooks + components. Components remain prop-driven and callback-driven.
```

### Data Flow

```
App.jsx (orchestration)
  → useGameSession manages state + localStorage persistence
  → useMarketActions handles assignment/sell/buy callbacks
  → useSeasonAdvance resolves seasons + toast side effects
  → useToastNotifications manages transient UI notifications
  → props flow into components and callbacks flow back to hooks
```

### gameState Shape

```js
{
  year: 1780,             // current calendar year
  seasonIndex: 0,         // 0=Spring 1=Summer 2=Fall 3=Winter
  money: 500,             // dollars (floating point, 2dp)
  workers: 6,             // total worker count
  plots: [{
    id: 1,
    name: "Home Field",
    soilHealth: 100,      // 0–100; degrades each harvest
    cropType: "tobacco",
    state: "fallow",      // fallow | planted | tended
    yieldModifier: 1.0,   // set in Summer, consumed in Fall
  }],
  resources: {
    rawTobacco: 0,        // lbs harvested, must be cured in Winter
    curedTobacco: 0,      // lbs ready to sell
  },
  assignments: {          // reset to 0 after each season resolves
    planting: 0,
    tending: 0,
    harvesting: 0,
    curing: 0,
    maintenance: 0,
  },
  log: [{ id: 1, text: "..." }], // newest first, max 20 entries
  logCounter: 2,          // next unique ID used for log entries
  gameOver: false,
  victory: false,
}
```

---

## Gameplay Loop

Each year has 4 seasons. Each season you:
1. Assign workers to the season's available tasks
2. Click "Advance Season" to resolve

| Season | Available tasks |
|--------|----------------|
| Spring | Planting |
| Summer | Tending / Weeding |
| Fall   | Harvesting |
| Winter | Curing (raw → cured, 2:1 ratio) AND Maintenance (soil restore) |

**Key mechanic:** Winter forces a tradeoff. Workers spent curing produce sellable tobacco. Workers spent on maintenance restore soil health. Uncured raw tobacco **rots** at end of Winter.

**Win condition:** Keep the operation solvent until Winter 1792 → Cotton Gin event fires in 1793.  
**Lose condition:** Money reaches $0 with no tobacco to sell.

---

## Historical Notes

- Game starts **1780** — during the Revolutionary War. Tobacco prices are suppressed (~4¢/lb).
- **1783** — Peace. European markets reopen. Tobacco recovers to ~6¢/lb.
- **1793** — Eli Whitney's cotton gin makes cotton dramatically more profitable. Victory condition.
- Soil depletion is real: tobacco monoculture degrades soil by 15 points per harvest per plot.
- The push toward cotton is the **carrot** (cotton's higher profitability), not a tobacco price crash.

**Historical accuracy rule:** Before implementing any new mechanic, verify it against `concept.txt` (repo root) or research sources first.

---

## Working with AI (GitHub Copilot) on This Codebase

### Context
- **Always open relevant files** before asking a question. Copilot uses open editor tabs as context.
- **Use `#file` in chat** to scope a question: `"In #file:seasonEngine.js, how does soil degradation work?"`
- The `.github/copilot-instructions.md` file is **auto-injected** into every Copilot session. Keep it updated when the data model changes.

### Writing code
- **Keep functions small and named descriptively.** `resolveSpring()` not `doStuff()`.
- **Write JSDoc on pure functions** in `seasonEngine.js` — Copilot reads these to understand intent.
- **All magic numbers go in `constants.js`.** Never hardcode `15` or `0.3` inside the engine.
- **Don't let files grow too large.** If a component is over ~150 lines, split it.

### Conversations
- **Start a new Copilot thread for each feature.** Don't carry styling context into game logic work.
- **Delete irrelevant prior messages** in a thread if the topic drifts.

### Historical accuracy
- Before implementing a new mechanic, ask Copilot to research the historical basis first.
- Refer to `concept.txt` for the research baseline from initial design discussions.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
