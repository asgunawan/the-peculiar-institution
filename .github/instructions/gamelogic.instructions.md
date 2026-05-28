---
applyTo: "src/gameLogic/**"
---

Use historical grounding before changing economy constants.

Checklist before editing any numeric tuning in game logic:
1. Read docs/history.md.
2. Keep all numeric tuning in src/gameLogic/constants.ts (do not hardcode elsewhere).
3. Prefer historically grounded prices for tobacco (low single-digit cents per lb).
4. Preserve the design intent that soil degradation and labor allocation create pressure.
5. If a value is gameplay-scaled, leave a short comment explaining why.

If research changes a historical range, update docs/history.md in the same session.
