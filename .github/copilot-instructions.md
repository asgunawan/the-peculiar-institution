# GitHub Copilot Instructions — The Peculiar Institution

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
    soilHealth: number,    // 0–100
    cropType: "tobacco",
    state: "fallow"|"planted"|"tended",
    yieldModifier: number, // 0.3–1.0
  }],
  resources: { rawTobacco: number, curedTobacco: number },
  assignments: { planting:n, tending:n, harvesting:n, curing:n, maintenance:n },
  log: string[],           // newest first, max 20
  gameOver: boolean,
  victory: boolean,
}
```

## Key files
- `src/gameLogic/constants.js` — ALL tuning values. Never hardcode numbers elsewhere.
- `src/gameLogic/initialState.js` — `createInitialState()` returns a fresh gameState.
- `src/gameLogic/seasonEngine.js` — `resolveSeason(state) → nextState` (pure). `getSellPrice(year) → cents`.
- `src/App.jsx` — owns state, wires all components, handles all market actions.
- Components receive props only, call callbacks only, own no game state.

## Conventions
- All prices are in **cents per pound**. Convert to dollars (÷100) only at display/sell time.
- `assignments` are reset to 0 by `resolveSeason` after each season.
- Raw tobacco rots if not cured in Winter — do not carry it forward.
- Soil health clamps between 0 and 100.
- Log entries: string[], newest first. Slice to 20.
- Money: use `parseFloat((n).toFixed(2))` to avoid floating point drift.

## Historical accuracy rule
Before implementing any new mechanic (overseer, slave market, cotton, research tree),
research the historical basis first. Check concept.txt in the repo root for design research.
Do not implement from assumption — ask for sources.

## Out of scope (MVP)
Cotton chain, cotton gin mechanics, named workers, research/adoption tree,
historical random events, overseer system, slave auction market, guano imports, sound.
