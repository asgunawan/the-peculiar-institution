"""Standalone balance simulation — Strategies A, B, C."""
import math, sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Constants (mirror game engine) ──────────────────────────────────────────
BASE_YIELD          = 2000   # lbs tobacco per plot @ 100% soil / full tend
SOIL_DEGRADE        = 20     # soil lost per harvest
SOIL_RESTORE        = 4      # soil gained per maintenance worker in Winter
FALLOW_RECOVERY     = 3      # passive soil recovery per fallow season
FALLOW_CAP          = 75     # passive recovery cap
CURING_RATIO        = 2      # raw lbs → cured lbs (2:1)
CURING_CAP_PER_W    = 1000   # lbs raw tobacco a worker can cure per Winter
TEND_RATIO          = 1.5    # workers per plot for full yield mod
UPKEEP_NORMAL       = 7      # $ per enslaved worker per Winter
UPKEEP_PROVISION    = 4      # $ per enslaved worker per Winter w/ provision grounds
FREE_WAGE           = 15     # $ per free worker per season (hired for curing)
HIREOUT             = 3      # $ per idle worker per season (hire-out)
WORKER_COST         = 200    # $ to buy an enslaved worker
PLOT_COST           = 150    # $ to buy a land plot
CABIN_COST          = 60     # $ per Quarter Cabin (+6 housing)
CABIN_CAP           = 6      # housing per cabin built
BASE_HOUSING        = 6      # starting housing capacity (no cabin needed)
TOOL_SHED_COST      = 80     # $ one-time tool shed purchase
TOOL_SHED_BONUS     = 0.10   # +10% harvest yield
DEBT_LIMIT          = 3      # seasons in debt before game-over
VICTORY_YEAR        = 1793
START_YEAR          = 1780
START_MONEY         = 500.0
START_WORKERS       = 4

SEASONS = ["Spring", "Summer", "Fall", "Winter"]

def price(year):
    """Tobacco price in cents/lb."""
    return 4 if year < 1783 else 6

def clamp(v, lo, hi):
    return max(lo, min(hi, v))


class Plot:
    def __init__(self, pid):
        self.id = pid
        self.soil = 100.0
        self.state = "fallow"    # fallow | planted | tended
        self.yield_mod = 1.0
        self.resting = False
        self.crop = "tobacco"    # "tobacco" | "provision"


def run(label, strategy_fn):
    year = START_YEAR
    si = 0
    money = START_MONEY
    workers = START_WORKERS
    plots = [Plot(1)]
    next_id = [2]
    cabins = [0]
    tool_shed = [False]
    provision = [False]
    raw = [0]
    cured = [0]
    debt = [0]
    history = []

    def housing():
        return BASE_HOUSING + cabins[0] * CABIN_CAP

    def upkeep():
        return UPKEEP_PROVISION if provision[0] else UPKEEP_NORMAL

    def ymult():
        return 1 + TOOL_SHED_BONUS if tool_shed[0] else 1.0

    def tobacco_plots():
        return [p for p in plots if p.crop == "tobacco"]

    def snap(ev=None):
        tp = tobacco_plots()
        avg = sum(p.soil for p in tp) / len(tp) if tp else 0
        history.append(dict(
            year=year, season=SEASONS[si],
            money=round(money, 2), workers=workers,
            plots=len(tp), prov=len(plots) - len(tp),
            cabins=cabins[0], shed=int(tool_shed[0]), provision=int(provision[0]),
            avg_soil=round(avg, 1),
            min_soil=round(min((p.soil for p in tp), default=0), 1),
            raw=raw[0], cured=cured[0], debt=debt[0], event=ev or "",
        ))

    for _ in range(120):   # safety cap
        season = SEASONS[si]

        # Victory check
        if year >= VICTORY_YEAR and season == "Summer":
            snap("VICTORY")
            break

        # Strategy decisions (mutate via lists to allow inner-function writes)
        def new_plot(crop="tobacco"):
            money_ref[0] -= PLOT_COST
            p = Plot(next_id[0]); p.crop = crop
            plots.append(p); next_id[0] += 1

        def new_worker():
            money_ref[0] -= WORKER_COST; workers_ref[0] += 1

        def new_cabin():
            money_ref[0] -= CABIN_COST; cabins[0] += 1

        def buy_shed():
            money_ref[0] -= TOOL_SHED_COST; tool_shed[0] = True

        def do_provision():
            tp = tobacco_plots()
            fallow_tb = [p for p in tp if p.state == "fallow"]
            if len(tp) > 1 and fallow_tb:
                worst = min(fallow_tb, key=lambda p: p.soil)
                worst.crop = "provision"
                provision[0] = True

        money_ref = [money]
        workers_ref = [workers]

        strategy_fn(season, year, money_ref, workers_ref, cabins, tool_shed, provision,
                    housing, tobacco_plots, new_plot, new_worker, new_cabin, buy_shed, do_provision)

        money = money_ref[0]
        workers = workers_ref[0]

        # Rotation: rest plots below soil threshold
        active_fallow = [p for p in tobacco_plots() if p.state == "fallow" and not p.resting]
        for p in active_fallow:
            others = [q for q in active_fallow if q.id != p.id and not q.resting]
            if p.soil < 66 and len(others) >= workers - 1:
                p.resting = True

        # ── Season resolution ──────────────────────────────────────────────

        if season == "Spring":
            tp = tobacco_plots()
            plantable = [p for p in tp if p.state == "fallow" and not p.resting]
            plant = min(len(plantable), max(0, workers - 1))
            for p in plantable[:plant]:
                p.state = "planted"
                p.resting = False
            money += max(0, workers - plant) * HIREOUT

        elif season == "Summer":
            tp = tobacco_plots()
            planted = [p for p in tp if p.state == "planted"]
            if planted:
                full = len(planted) * TEND_RATIO
                tw = min(workers, math.ceil(full))
                mod = clamp(tw / full, 0.3, 1.0) if full > 0 else 1.0
                for p in planted:
                    p.yield_mod = mod
                    p.state = "tended"
                money += max(0, workers - tw) * HIREOUT
            else:
                money += workers * HIREOUT

        elif season == "Fall":
            tp = tobacco_plots()
            ready = [p for p in tp if p.state in ("tended", "planted")]
            hw = min(workers, len(ready))
            for p in ready[:hw]:
                raw[0] += math.floor(BASE_YIELD * (p.soil / 100) * p.yield_mod * ymult())
                p.soil = max(0, p.soil - SOIL_DEGRADE)
                p.state = "fallow"; p.yield_mod = 1.0
            for p in ready[hw:]:
                p.state = "fallow"; p.yield_mod = 1.0
            money += max(0, workers - hw) * HIREOUT

        elif season == "Winter":
            # Sell cured tobacco
            if cured[0]:
                money += (cured[0] * price(year)) / 100.0
                cured[0] = 0

            # Curing: use enslaved workers, hire free if overflow
            needed = math.ceil(raw[0] / CURING_CAP_PER_W) if raw[0] else 0
            free_extra = max(0, needed - workers)
            free_cost = free_extra * FREE_WAGE
            if money >= free_cost:
                money -= free_cost
                cw = workers + free_extra
            else:
                aff = int(money // FREE_WAGE)
                money -= aff * FREE_WAGE
                cw = workers + aff

            cap = cw * CURING_CAP_PER_W
            used = min(raw[0], cap)
            cured[0] += math.floor(used / CURING_RATIO)
            raw[0] = 0

            # Winter maintenance: idle workers restore soil
            maint = max(0, workers - min(cw, workers))
            tp = tobacco_plots()
            if maint and tp:
                add = maint * SOIL_RESTORE / len(tp)
                for p in tp:
                    p.soil = clamp(p.soil + add, 0, 100)

            # Upkeep
            money -= workers * upkeep()

        # Passive fallow recovery
        for p in tobacco_plots():
            if p.state == "fallow" and p.soil < FALLOW_CAP:
                p.soil = clamp(p.soil + FALLOW_RECOVERY, 0, FALLOW_CAP)

        # Debt check
        if money < 0:
            debt[0] += 1
            if debt[0] >= DEBT_LIMIT and not cured[0] and not raw[0]:
                snap("GAME_OVER")
                break
        else:
            debt[0] = 0

        snap()
        si = (si + 1) % 4
        if si == 0:
            year += 1

    outcome = next((h["event"] for h in history if h["event"]), None) or "TIME_LIMIT"
    final = history[-1]
    return history, label, outcome, final


# ── Strategy A — Standard ────────────────────────────────────────────────────

def strat_A(season, year, m, w, cab, shed, prov, housing, tb, new_plot, new_worker, new_cabin, buy_shed, do_prov):
    if season != "Spring":
        return
    active = [p for p in tb() if not p.resting]
    need = math.ceil(max(len(active), 1) * TEND_RATIO) + 1
    while w[0] < need and m[0] >= WORKER_COST + 100:
        if w[0] >= housing():
            if m[0] >= CABIN_COST + 100:
                new_cabin()
            else:
                break
        new_worker()
    if w[0] >= need and m[0] >= PLOT_COST + 200:
        new_plot()


# ── Strategy B — Land-heavy ──────────────────────────────────────────────────

def strat_B(season, year, m, w, cab, shed, prov, housing, tb, new_plot, new_worker, new_cabin, buy_shed, do_prov):
    if season != "Spring":
        return
    while m[0] >= PLOT_COST + 100:
        new_plot()


# ── Strategy C — Infrastructure-first ───────────────────────────────────────

def strat_C(season, year, m, w, cab, shed, prov, housing, tb, new_plot, new_worker, new_cabin, buy_shed, do_prov):
    # Buy tool shed in Winter if affordable
    if season == "Winter":
        if not shed[0] and m[0] >= TOOL_SHED_COST + 50:
            buy_shed()
        return
    if season != "Spring":
        return
    # Workers: keep up to full-tend coverage + 1 spare, housing-gated
    active = [p for p in tb() if not p.resting]
    need = math.ceil(max(len(active), 1) * TEND_RATIO) + 1
    while w[0] < need and m[0] >= WORKER_COST + 80:
        if w[0] >= housing():
            if m[0] >= CABIN_COST + 80:
                new_cabin()
            else:
                break
        new_worker()
    # Provision grounds once 3+ tobacco plots owned and not yet converted
    if len(tb()) >= 3 and not prov[0]:
        do_prov()
    # Buy one plot per spring if affordable
    if m[0] >= PLOT_COST + 200:
        new_plot()


# ── Run and report ────────────────────────────────────────────────────────────

all_results = []
for fn, lbl in [(strat_A, "A - Standard"), (strat_B, "B - Land-heavy"), (strat_C, "C - Infra-first")]:
    h, label, outcome, final = run(lbl, fn)
    all_results.append((h, label, outcome, final))

W = 90
for h, label, outcome, final in all_results:
    print(f"\n{'='*W}")
    print(f"  STRATEGY {label}")
    print(f"  Outcome: {outcome}  |  {final['year']} {final['season']}  |  "
          f"${final['money']:.2f}  |  {final['workers']}w / {final['plots']}tp / {final['prov']}prov  |  "
          f"shed={final['shed']}  cabins={final['cabins']}")
    print(f"{'='*W}")
    print(f"  {'Turn':<20}  {'$':>8}  {'W':>3}  {'TP':>3}  {'Pv':>3}  "
          f"{'Cab':>4}  {'Shd':>3}  {'AvgS':>5}  {'MinS':>5}  {'Raw':>5}  {'Curd':>5}  Notes")
    print(f"  {'-'*77}")
    prev_w = START_WORKERS
    prev_p = 1
    prev_prov = 0
    for t in h:
        notes = []
        if t["event"]:
            notes.append(f"*** {t['event']} ***")
        if t["workers"] > prev_w:
            notes.append(f"+{t['workers']-prev_w}w")
        if t["plots"] > prev_p:
            notes.append(f"+{t['plots']-prev_p}plot")
        if t["prov"] > prev_prov:
            notes.append("PROVISION-ON")
        if t["debt"] > 0:
            notes.append(f"DEBT{t['debt']}")
        if t["shed"] and not any(r["shed"] for r in h[:h.index(t)]):
            notes.append("SHED-BUY")
        prev_w = t["workers"]; prev_p = t["plots"]; prev_prov = t["prov"]
        turn = f"{t['year']} {t['season']}"
        print(f"  {turn:<20}  ${t['money']:>7.2f}  {t['workers']:>3}  {t['plots']:>3}  {t['prov']:>3}  "
              f"{t['cabins']:>4}  {t['shed']:>3}  {t['avg_soil']:>5.1f}  {t['min_soil']:>5.1f}  "
              f"{t['raw']:>5}  {t['cured']:>5}  {'  '.join(notes)}")
    debt_seasons = sum(1 for t in h if t["debt"] > 0)
    min_money = min(t["money"] for t in h)
    print(f"\n  Debt seasons: {debt_seasons}  |  Lowest treasury: ${min_money:.2f}")

print(f"\n{'#'*W}")
print(f"  SUMMARY")
print(f"{'#'*W}")
print(f"  {'Strategy':<24}  {'Outcome':<11}  {'Ended':<16}  {'$Final':>8}  {'$Min':>8}  {'Debt':>5}")
for h, label, outcome, final in all_results:
    debt_seasons = sum(1 for t in h if t["debt"] > 0)
    min_money = min(t["money"] for t in h)
    turn_label = f"{final['year']} {final['season']}"
    print(f"  {label:<24}  {outcome:<11}  {turn_label:<16}  ${final['money']:>7.2f}  ${min_money:>7.2f}  {debt_seasons:>5}")
print()
