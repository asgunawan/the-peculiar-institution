# Educational Game Design — Design Philosophy
*How this game teaches without feeling like a classroom.*

---

## Core Principle: Mechanics Are the Curriculum

The best educational games don't interrupt play to deliver a lesson. They put the player into a situation where the lesson happens *to* them.

**Oregon Trail** — you don't read that river crossings were dangerous. Your oxen drown. The lesson is procedural — the system teaches it, not the text.

**Crusader Kings II/III** — nobody explains why feudal succession was unstable. You feel it every time your heir dies and your empire fractures. You become the historical actor, making the same calculations they did.

**Papers, Please** — teaches more about authoritarianism and bureaucratic complicity than most essays, through one mechanic: you are the border agent. The moral discomfort is the lesson.

**The pattern they all share:** the mechanic IS the lesson. Education is embedded in play, not layered on top of it.

---

## How The Peculiar Institution Applies This

The game's educational content and its gameplay systems are *the same thing*:

| Mechanic | What it actually teaches |
|---|---|
| Soil depletion | Why Chesapeake planters were always expanding west — the land ran out in 3–7 years |
| Factor price uncertainty | Why Virginia planters were trapped in debt and resented British merchants |
| Must buy new plots to grow | Why tobacco farming required constant frontier expansion |
| Clicking "Purchase Enslaved Worker" | The mundane transactional reality of slavery — more affecting than any explanation |
| Tobacco price fluctuations beyond player control | The helplessness of the consignment system that drove planters to revolution |
| Debt foreclosure pressure | Why most small planters failed — not from laziness but from structural forces |

None of this needs to be explained. Players feel all of it through the pressure of trying to survive 1780–1793.

---

## Three Design Layers (All Independent)

### Layer 1 — Mechanics (required, teaches passively)
The game loop itself. Already built. Players will understand 18th-century Virginia tobacco economics because they lived it in miniature, not because they read about it.

### Layer 2 — Voice (ambient, no reading required)
Period-appropriate language used naturally throughout the UI and event log. Not a glossary or explanation — just the right words in context. Examples:

- "Provisioning for 6 enslaved workers cost $42." (not "worker maintenance costs")
- "East Field yields are thinning — tobacco demands fresh land." (not "soil health is low")
- "The factor's agent arrived. Your hogsheads were graded at 3¢/lb."

Vocabulary is absorbed through use. Players pick up "hogshead," "factor," "fallow," "curing" without a tutorial.

### Layer 3 — Optional Historical Notes
Accessible from a menu (e.g., an "Almanac" or "Ledger" page), never interrupting gameplay. Short entries on key topics for players who want depth:

- The factor system and consignment trade
- Soil exhaustion and the westward tobacco frontier  
- What a hogshead was and why it was the unit of trade
- Who William Calder's arc is historically based on (see `docs/historical-references.md`)
- The 1780 context: war, price disruption, Piedmont expansion

**Rule: optional depth layer is never required to play or progress.**

---

## The "Gameplay First" Contract

The game commits to this hierarchy:

1. Is it fun and tense? → If not, no amount of history fixes it.
2. Is it historically honest? → The mechanics should model real pressures, not invented ones.
3. Does it offer depth for curious players? → Yes, through the optional layer.

Players who never read a tooltip will still come away having viscerally understood:
- Why tobacco farming drove westward expansion
- Why planters were perpetually in debt
- That the word "peculiar institution" was what Americans used when they didn't want to say slavery out loud

---

## What to Avoid

- Pop-up facts that interrupt play ("Did you know tobacco depletes soil nitrogen?") — kills pacing
- Quizzes or comprehension checks of any kind
- Making historical content required for progression
- Over-explaining the moral stakes (the mechanic already makes that point; a lecture insults the player)
- Tooltips longer than two sentences

---

## The Failure/Victory Text Pattern

Game-over and victory screens are the one moment where slightly more context is appropriate, because the player just finished a run and is naturally reflective:

**Failure example:**
> "The plantation is lost. Most Piedmont planters of the 1780s failed not from lack of effort, but from a combination of debt pressure, soil exhaustion, and price volatility they could not predict or control. William Calder was not unusual."

**Victory example:**
> "It is 1793. Eli Whitney's cotton gin changes everything — but the center of gravity shifts south, to Georgia and the Carolinas. Virginia tobacco survives, for now. What you have built is a foothold, not a fortune. The next chapter is harder."

This is education. It doesn't feel like education.

---

## Further Reading (For Designers)

- T.H. Breen, *Tobacco Culture* (Princeton, 1985) — the essential book on planter psychology
- Ian Bogost, *Persuasive Games* (MIT, 2007) — the theoretical foundation for "procedural rhetoric"
- Kurt Squire, *Video Games and Learning* (Teachers College Press, 2011) — on games as learning environments
- Jesper Juul, *Half-Real* (MIT, 2005) — on the relationship between game rules and fiction
