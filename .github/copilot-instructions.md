# GitHub Copilot Instructions — The Peculiar Institution

## Clarification rule
If the user's intent is unclear — ambiguous bug report, vague feature request, screenshot with no description — use `vscode_askQuestions` to ask before assuming and implementing. Ask as many clarifying questions as needed, and ask follow-up questions if the first answer raises new ambiguities. The user is available and prefers to answer questions over having the agent guess and waste effort.

## Project summary
Text-based antebellum plantation economic simulation. React + Vite. No art assets.
Start year: 1780 (tobacco). Victory: 1793 (cotton gin). Game over: bankruptcy.

## Stack
- React 19 + Vite
- No Redux, no external state library
- No CSS frameworks — plain CSS variables in index.css / App.css
- All game logic is pure JS in src/gameLogic/ (no React imports there)

## gameState shape (canonical reference)
```js
{
  year: number,            // 1780+
  seasonIndex: number,     // 0=Spring 1=Summer 2=Fall 3=Winter
  money: number,           // dollars, 2dp
  workers: number,         // total worker count (integer)
  plots: [{
    id: number,
    name: string,
    soilHealth: number,    // 0–100
    cropType: "tobacco",
    state: "fallow"|"planted"|"tended",
    yieldModifier: number, // 0.3–1.0
  }],
  resources: { rawTobacco: number, curedTobacco: number },
  assignments: { planting:n, tending:n, harvesting:n, curing:n, maintenance:n },
  log: [{ id:number, text:string }], // newest first, max 20
  logCounter: number,      // next unique integer id for log entries
  gameOver: boolean,
  victory: boolean,
}
```

## Key files
- `src/gameLogic/constants.js` — ALL tuning values. Never hardcode numbers elsewhere.
- `src/gameLogic/initialState.js` — `createInitialState()` returns a fresh gameState.
- `src/gameLogic/logUtils.js` — log normalization and push helpers for stable event IDs.
- `src/gameLogic/taskHints.js` — shared task labels and hint formatting logic.
- `src/gameLogic/seasonEngine.js` — `resolveSeason(state) → nextState` (pure). `getSellPrice(year) → cents`.
- `src/hooks/useGameSession.js` — state and localStorage persistence ownership.
- `src/hooks/useMarketActions.js` — buy/sell/assignment callbacks.
- `src/hooks/useSeasonAdvance.js` — season transition and outcome toasts.
- `src/hooks/useToastNotifications.js` — transient UI toast state.
- `src/App.jsx` — orchestrates hooks and component wiring.
- Components receive props only, call callbacks only, own no game state.

## Conventions
- All prices are in **cents per pound**. Convert to dollars (÷100) only at display/sell time.
- `assignments` are reset to 0 by `resolveSeason` after each season.
- Raw tobacco rots if not cured in Winter — do not carry it forward.
- Soil health clamps between 0 and 100.
- Log entries are objects `{ id, text }`, newest first. Slice to 20.
- Money: use `parseFloat((n).toFixed(2))` to avoid floating point drift.

## Historical accuracy rule
Before implementing any new mechanic (overseer, slave market, cotton, research tree),
research the historical basis first. Check concept.txt in the repo root for design research.
Do not implement from assumption — ask for sources.

## Verified historical reference (quick)
- Use `docs/history.md` as the working baseline for economy tuning.
- Tobacco price anchor for 1780s: low single-digit cents per pound (roughly 2-5c/lb).
- Productivity anchor: roughly 1,700 lbs tobacco per worker-year (late Chesapeake benchmark).
- Tobacco labor model: gang-based supervised teams were common.
- Soil depletion from tobacco monoculture was severe and should remain core pressure.
- Planter finances were debt-pressured; recurring upkeep pressure is more realistic than instant $0 collapse.

When changing `src/gameLogic/constants.js`, read `docs/history.md` first and update it if new research changes a historical range.

## Out of scope (MVP)
Cotton chain, cotton gin mechanics, named workers, research/adoption tree,
historical random events, overseer system, slave auction market, guano imports, sound.
