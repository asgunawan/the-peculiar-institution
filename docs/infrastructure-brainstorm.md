# Infrastructure & Upgrade System — Brainstorm
**Status: Pre-implementation design notes. Nothing here is wired up yet.**

---

## Why infrastructure is needed

Right now the game has no constraint on how many enslaved workers you can own beyond purchase cost.
Historically that's wrong on two levels:

1. **Physical housing**: You cannot hold 30 enslaved people on a small Virginia parcel with nowhere
   for them to sleep. Slave quarters were real infrastructure with real cost — built from plantation
   timber over a Winter by the workforce itself. Thomas Jefferson's Monticello had a dedicated
   "Mulberry Row" of cabins, a smokehouse, dairy, wash house, joinery, and smithy all tied to
   housing enslaved workers.

2. **Supervision capacity**: Without a driver or overseer, a planter cannot efficiently direct more
   than ~8–10 workers in coordinated gang labor. Above that threshold productivity per-worker
   starts falling without organizational structure. Historically ~70% of planters used an
   enslaved "driver" (trusted supervisor); fewer than 30% employed a paid white overseer.

These two constraints — housing capacity and supervision capacity — should gate workforce scaling
and make the "just buy more workers" loop require real investment.

---

## Historical research notes

Sources: Wikipedia — "Plantation complexes in the Southern United States"; "Slave quarters in the
United States"; history.md baseline; Toman (2005) on gang system comparative advantage.

### Housing
- Typical slave cabin: 1–2 rooms ("pens"), ~200 sq ft, log or frame, dirt floor, clay chimney.
  Later examples raised on piers, plank floors. Sizes ranged 8×10 to 10×12 ft.
- 1 cabin housed roughly 1 family unit (4–6 people). Field cabins sometimes isolated near plots.
- Built from plantation lumber by enslaved workers, typically in Winter off-season.
- More fortunate workers (skilled trades, house servants) had better housing; field workers had
  the bare minimum.

### Provisions
- Planters provided annual clothing allotments and food rations but these were frequently
  inadequate. Enslaved workers supplemented with kitchen gardens, hunting, fishing, chicken-
  keeping on their own time (Sundays, Saturday afternoons on some Virginia plantations).
- Provision grounds reduced the planter's cash outlay for subsistence. Some planters actively
  encouraged this as an economic measure.
- Historical upkeep range: roughly $20–$50 per worker per year for food, clothing, basic care
  (docs/history.md baseline).

### Tools
- Hoe was the primary tobacco tool — Evans (2012) "The Plantation Hoe: Rise and Fall of an
  Atlantic Commodity" tracks it as a key trade good for the Chesapeake.
- Blacksmith shop was a common ancillary structure; maintained iron tools, did general ironwork.
- Tool quality directly affected productivity; poor tools were common at small operations.

### Gang labor system
- Tobacco in the Chesapeake used gang labor: workers grouped by ability into gangs, each gang
  paced by the fastest member or by a driver. Sources: Wikipedia citing Toman (2005) in
  Explorations in Economic History.
- The gang system's productivity premium over free/task labor is documented: after emancipation,
  "tenant farmers were less productive than enslaved workers under the gang system" (Wikipedia,
  Post-emancipation section).
- Driver: an enslaved foreman who supervised the gang's daily pace. Did not do field work him/
  herself. Required trust from the planter but was cheaper than a paid overseer.
- Overseer: paid white supervisor. Salary ranged historically; responsible for quotas, discipline,
  distributing food/tools/clothing, record-keeping. Jefferson famously called them "the most
  abject, degraded, and unprincipled race" — overseers were socially looked down upon even by
  planters who depended on them.

---

## Proposed upgrade system: Enslaved path

This path is the "scale through capital and coercion" route.
The free labor path (sketched below) is the "scale through cash wages and seasonal contracts" route.

Each tier unlocks the next one and gates worker count.

---

### Tier 1 — Starting condition (1–6 workers, no buildings required)
The planter and his family supervise directly. This is historically accurate for small operations.
Works fine at 4–6 workers; diminishing returns begin above that without structure.

**No new buildings. This is where the game starts.**

---

### Tier 2 — Slave Quarters (unlocks up to ~12 workers)

**Building: Quarter Cabin Row**
- Cost: ~$50–75 per cabin. Each cabin holds 4–6 workers.
- Built: Player assigns workers to construction during Winter. Takes 1 Winter season.
  (No field work conflict since there's nothing to do in Winter but curing/maintenance.)
- Effect: +6 worker housing capacity per cabin built. Without housing, you cannot purchase
  more enslaved workers beyond the starting 4 (or whichever number you have).
- UI gate: "Purchase Enslaved Worker" button disabled if `workers.length >= housingCapacity`.
  Show "Build more quarters to house additional workers."

**Design question**: Do we let the player build multiple cabins? Cap at 2–3 cabins per Tier 2?
Or let them build as many as they want (limited only by money)?

**Historical grounding**: Field cabins were scattered near plots or grouped in a "quarter row"
away from the main house. Built from plantation timber — no cash market needed, just labor time.

---

### Tier 3 — Provision Grounds (reduces upkeep cost)

**Upgrade: Provision Plot**
- Cost: Permanently dedicate 1 plot to provision food production (not available for tobacco).
- Effect: Enslaved upkeep per season drops from $7 → $4. Workers are partially self-provisioning.
- Can be built at any point. Useful once you have 6+ workers (saves $18+/season).
- Tradeoff: Loses a tobacco plot permanently (or until you sell/destroy the provision plot).

**Historical grounding**: Virginia planters widely used provision grounds. Enslaved workers tended
them on Sundays or Saturday afternoons. Reduced planter's cash burden significantly.

**Design question**: Should provision grounds scale (2 plots = $4→$2/worker)? Or diminishing
returns? Or a flat one-time reduction?

---

### Tier 4 — Tool Shed (productivity bonus)

**Building: Tool Cache / Hoe Shed**
- Cost: $60–100 one-time purchase (from a passing trader, in the Market).
- Effect: +10–15% yield modifier on harvesting tasks (good iron hoes make picking faster/cleaner).
  Without the tool shed, harvesting operates at a slight penalty (e.g., yieldModifier cap is 0.9
  instead of 1.0 at full tending).
- No ongoing cost.

**Historical grounding**: Hoe quality was a real productivity bottleneck. The hoe was so central
to tobacco that it was a major trade good exported specifically to the Chesapeake.

**Design question**: Should starting workers have a small tool penalty that's removed by this
upgrade? Or should this just be a bonus on top of baseline?

---

### Tier 5 — Driver System (unlocks gang labor productivity)

**Upgrade: Appoint a Driver**
- Cost: No cash cost. You promote one enslaved worker to "driver" role.
- Mechanic: That worker is permanently removed from field assignments (they supervise, not work).
  Your field worker count decreases by 1, but the remaining workers gain a gang productivity bonus.
- Effect: Workers assigned to tending or harvesting get a 1.15x output multiplier when operating
  in a supervised gang. Roughly: losing 1 worker but gaining 15% on the rest. Net positive at 8+
  workers in field.
- The driver system only works up to ~10–12 direct reports before supervision degrades.

**Historical grounding**: ~70% of planters used enslaved drivers rather than paid overseers.
Drivers were trusted workers, sometimes able to negotiate minor privileges. They occupied an
uncomfortable position: enforcing the gang pace to avoid punishment themselves.

**Design question**: Should the driver be a named worker? A specific person you designate from
your existing workforce? That could be powerful storytelling but complex to implement.

**Moral weight**: The player is explicitly appointing one enslaved person to coerce the others.
This should be surfaced in the log: "Appointed [worker] as driver. The pace in the fields
quickens. The others notice."

---

### Tier 6 — Overseer System (full gang productivity, unlocks large operations)

**Building: Overseer's House**
- Cost: $100–150 to build (during Winter, using workers).
- Ongoing cost: $20–25/season overseer salary (cash, deducted in Winter like enslaved upkeep).
- Effect: Full gang system — 1.35–1.4x multiplier on tending and harvesting for ALL workers in
  supervised gangs. Removes the driver's supervision cap; can scale to 20+ workers.
- Required before purchasing beyond ~16–18 workers (can't manage large gangs without an overseer).

**Historical grounding**: On larger operations, the overseer rose before the enslaved people,
assigned daily tasks, distributed food/tools/clothing, kept crop records, and enforced discipline.
Historically described as an "indispensable cog in the plantation machinery." Social status between
planter and enslaved workers — not welcome in either social world.

**Design question**: Should there be an overseer "quality" mechanic? Bad overseers reduce morale
(productivity), good ones increase it? Probably too complex for MVP.

---

## Proposed upgrade system: Free labor path (sketch only, post-MVP)

The free labor path is the "scale without fixed capital" route. Higher ongoing costs, no forced
productivity, no housing requirement — but also no compounding capital asset value.

**Tier 1: Tenant Cabin**
- Small cabin for seasonal workers to stay on-site.
- Allows pre-booking free workers for next season (guaranteed availability).
- Without it, you hire from the local market each season — availability not guaranteed.

**Tier 2: Labor Contractor Arrangement**
- Ongoing relationship with a labor recruiter.
- Hire in batches of 3–5 at a slight discount per worker.
- Requires established credit/reputation (no debt seasons).

**Tier 3: Craftsman Workshop**
- Attracts skilled specialty workers (blacksmith, carpenter) who provide plantation-wide bonuses.
- Different from field labor — these are persistent hired specialists.
- Blacksmith: reduces tool upkeep / replacement cost.
- Carpenter: reduces building construction cost.

**Key difference from enslaved path**: No productivity multiplier. Free workers cannot be gang-
forced. The free labor path is economically competitive only with strong cash flow and good
planning. The productivity ceiling is lower; the capital risk is lower.

---

## Implementation sequencing (proposed)

1. **Housing gate first** — this is the blocker. Without it, enslaved workers scale infinitely.
   Implement Tier 2 (Quarter Cabin) as the first feature. Requires:
   - New data structure: `buildings: [{ id, type, builtYear }]` in gameState
   - `housingCapacity` derived value (computed from buildings)
   - Gate on `handleBuyWorker` in `useMarketActions.js`
   - Winter construction action (new task assignment or market button)

2. **Provision Grounds** — quick win. Mostly a constants/upkeep tweak with a plot-state change.

3. **Tool Shed** — single market purchase, one constant, one yield modifier change.

4. **Driver System** — needs worker identity (named workers or at least a designated index).
   Requires workers to have more than just `{ id, type }` — needs a `role` field.
   (`role: "field" | "driver" | "overseer"`)

5. **Overseer System** — after Driver is in place. Adds a new market item and ongoing cost.

6. **Free labor path** — post-MVP, after enslaved path is solid.

---

## Open design questions

1. **How granular is building?** Do we track individual cabins, or just "Quarters Tier 1/2/3"?
   Individual cabins are more realistic; tiers are simpler to implement.

2. **Construction labor cost**: Should building a cabin require assigning workers for a Winter
   season (taking them off curing/maintenance)? This creates a real opportunity cost and feels
   authentic. Or just a cash cost for simplicity?

3. **Worker identity for driver role**: Currently workers are `{ id, type }`. Naming them (or at
   least giving them a persistent role) is a bigger data model change. Worth doing before the
   driver system, or scope it to just a `driverCount` integer?

4. **Driver promotion narrative**: If a driver is just a number, the moral weight is abstract.
   If each enslaved worker is an individual, appointing a driver is a specific act. The game's
   framing should not let the player forget what the driver system is doing.

5. **Net productivity math**: Need to verify the break-even points are right for game balance.
   - Driver: lose 1 worker, gain 1.15x on rest. Break-even at 7 field workers (8 total).
   - Overseer: $20/season salary + $150 construction. At 4¢/lb tobacco, what worker count
     makes this worth it? Rough math needed before implementation.

6. **Provision grounds tradeoff**: Losing a tobacco plot permanently is a significant cost.
   Is $3/season/worker savings enough motivation? At 20 workers that's $60/season saved.
   Should provision grounds affect upkeep scaling differently at larger workforce sizes?

---

## What this does to game design

With this system in place, the game loop becomes:
- **Years 1–3**: Small operation, tight cash, build your first quarters, buy 2–3 more workers.
- **Years 4–7**: Mid-size operation, provision grounds reduce pressure, tool shed improves yields,
  consider appointing a driver.
- **Years 8–13 (→ 1793 victory)**: Large operation with overseer, multiple plot rows, high output
  but also high fixed costs. Soil depletion becomes the binding constraint.

The free labor path remains viable as a complementary or alternative strategy — hire seasonal
workers for burst capacity without building out the housing infrastructure — but it cannot
replicate the compounding productivity of a well-built enslaved operation.

---

*Last updated: 2026-05-24. Historical sources: Wikipedia Plantation Complexes; Slave Quarters in
the United States; Evans (2012) on the plantation hoe; Toman (2005) on gang system economics;
docs/history.md baseline.*
