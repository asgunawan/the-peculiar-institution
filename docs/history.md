# Historical Baseline (1780-1793 MVP)

Purpose: compact, verified historical reference for core economy tuning.
Scope: tobacco phase only; use this before changing any constants in src/gameLogic/constants.js.

## Verified ranges

- Tobacco sale price (1780s Chesapeake): about 2-5 cents per pound (cured leaf).
- Worker output benchmark: about 1,710 lbs tobacco per worker per year (late 1600s Chesapeake benchmark from Menard data cited by Wikipedia).
- Labor organization: gang system was common for tobacco, often teams of about 8-12 workers under supervision.
- Soil effect: tobacco monoculture caused severe depletion; yield dropped quickly without rotation/fallow/restoration.
- Planter finance reality: chronic debt pressure was common (not instant collapse at $0 cash).
- Annual provisioning burden: rough historical order of magnitude for support costs is about $20-$50 per worker per year (food, clothing, basic care; varies by place/time).

## Design implications for this project

- Keep tobacco prices in low single-digit cents per pound for historical grounding.
- Make playability come from yield scale and management quality, not inflated per-lb prices.
- Represent debt pressure through recurring upkeep/maintenance pressure rather than only hard bankruptcy at $0.
- Keep soil degradation as a central pressure mechanic in tobacco phase.

## Practical conversion guide for constants

- If 1 plot is treated as roughly 3-4 acres at about 500 lbs/acre/year, then a full-year raw output target per plot is around 1,500-2,000 lbs.
- Since this game resolves major raw yield in Fall, BASE_YIELD_PER_PLOT should be calibrated so a well-managed plot can produce in that historical order of magnitude over the yearly cycle.
- Keep CURING_RATIO conservative (weight loss during curing is substantial; current 2:1 assumption is directionally reasonable for gameplay).

## Sources used in this baseline

- Wikipedia: Tobacco in the American colonies (includes Menard-based productivity figures and price trend context).
- Wikipedia: Plantation complexes in the Southern United States (labor organization and plantation operations context).
- Cited within those pages: Menard (1985), Craven (1926), and related Chesapeake tobacco scholarship listed in references.

## Update rule

When new historical research is done, update this file in <= 2 minutes:
- add/adjust number
- add one-line source pointer
- keep this document concise and operational
