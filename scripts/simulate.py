#!/usr/bin/env python3
"""
simulate.py — Strategy comparison for The Peculiar Institution.

Compares two strategies from the current starting conditions
(STARTING_MONEY=$500, STARTING_WORKERS=4, STARTING_PLOTS=1):

  A) Standard — buy enslaved workers when labor-limited, land when affordable.
  B) Land-heavy / Free-curing — never buy enslaved workers beyond 4.
     Expand land aggressively. Hire free workers each Winter to cover curing.

Usage:
    python scripts/simulate.py
"""

import math
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Constants (mirror src/gameLogic/constants.js) ──────────────────────────

BASE_YIELD_PER_PLOT       = 2000
SOIL_DEGRADE_PER_HARVEST  = 20
SOIL_RESTORE_PER_WORKER   = 4
FALLOW_RECOVERY_PER_SEASON = 3
FALLOW_RECOVERY_CAP       = 75
CURING_RATIO              = 2
CURING_CAPACITY_PER_WORKER = 1000
WORKERS_PER_PLOT_FULL_TEND = 1.5
ENSLAVED_UPKEEP           = 7      # paid once per Winter
FREE_WORKER_WAGE          = 15     # paid immediately on hire; worker leaves at season end
HIREOUT_INCOME            = 3      # per maintenance worker per growing season
ENSLAVED_COST             = 200
PLOT_COST                 = 150
DEBT_FORECLOSURE_SEASONS  = 3
FALLOW_SOIL_THRESHOLD     = 66     # rest plots below this health (user's threshold)
COTTON_GIN_YEAR           = 1793

STARTING_MONEY   = 500
STARTING_ENSLAVED = 4
STARTING_PLOTS   = 1
START_YEAR       = 1780

SEASONS = ["Spring", "Summer", "Fall", "Winter"]

def get_price(year):
    return 4 if year < 1783 else 6


# ── Simulation core ────────────────────────────────────────────────────────

class Plot:
    def __init__(self, pid):
        self.id = pid
        self.soil = 100.0
        self.state = "fallow"        # fallow | planted | tended
        self.yield_mod = 1.0
        self.resting = False

    def clone(self):
        p = Plot(self.id)
        p.soil, p.state, p.yield_mod, p.resting = self.soil, self.state, self.yield_mod, self.resting
        return p


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def simulate(strategy: str) -> tuple[list[dict], dict]:
    """
    Run a simulation to victory or game-over.

    strategy "A" — Standard (buy workers + land)
    strategy "B" — Land-heavy, 4 permanent workers, free-worker curing
    """
    year       = START_YEAR
    season_idx = 0
    money      = float(STARTING_MONEY)
    enslaved   = STARTING_ENSLAVED
    plots      = [Plot(1)]
    next_pid   = 2

    raw_tobacco   = 0
    cured_tobacco = 0
    debt_seasons  = 0
    total_rotted  = 0
    history       = []

    def log_turn(season, extra=None):
        avg_soil = sum(p.soil for p in plots) / len(plots) if plots else 0
        min_soil = min(p.soil for p in plots) if plots else 0
        row = dict(
            year=year, season=season,
            money=round(money, 2),
            enslaved=enslaved,
            plots=len(plots),
            avg_soil=round(avg_soil, 1),
            min_soil=round(min_soil, 1),
            raw=raw_tobacco,
            cured=cured_tobacco,
            debt=debt_seasons,
        )
        if extra:
            row.update(extra)
        history.append(row)

    for _turn in range(80):  # safety cap
        season = SEASONS[season_idx]

        # ── Victory check ──────────────────────────────────────────────────
        if year >= COTTON_GIN_YEAR and season == "Summer":
            log_turn(season, {"event": "VICTORY"})
            return history, {"outcome": "VICTORY", "year": year, "season": season,
                             "money": money, "enslaved": enslaved, "plots": len(plots),
                             "total_rotted": total_rotted}

        # ── Buying decisions (at season start, before resolution) ──────────
        #
        # Strategy A: Buy workers when labor-limited, land when affordable.
        # Priority: keep enough workers for full tending, then expand land.
        #
        # Strategy B: Never buy more enslaved workers.
        # Buy land whenever there's enough buffer.

        nonlocal_next_pid = [next_pid]  # mutable cell

        def buy_plot_if_affordable(min_buffer):
            nonlocal money, nonlocal_next_pid
            while money >= PLOT_COST + min_buffer:
                money -= PLOT_COST
                plots.append(Plot(nonlocal_next_pid[0]))
                nonlocal_next_pid[0] += 1

        def buy_plot_once(min_buffer):
            nonlocal money, nonlocal_next_pid
            if money >= PLOT_COST + min_buffer:
                money -= PLOT_COST
                plots.append(Plot(nonlocal_next_pid[0]))
                nonlocal_next_pid[0] += 1

        def buy_worker_once(min_buffer):
            nonlocal money, enslaved
            if money >= ENSLAVED_COST + min_buffer:
                money -= ENSLAVED_COST
                enslaved += 1

        if strategy == "A":
            if season == "Spring":
                # Decide how many workers we need for the coming year
                active_plots = len([p for p in plots if not p.resting])
                active_plots = max(active_plots, 1)
                workers_for_full_tend = math.ceil(active_plots * WORKERS_PER_PLOT_FULL_TEND)
                # Buy workers until we have enough for full tending + 1 spare
                target_workers = workers_for_full_tend + 1
                while enslaved < target_workers and money >= ENSLAVED_COST + 100:
                    buy_worker_once(100)
                # Buy land if we have excess workers and cash
                if enslaved > workers_for_full_tend + 1 or money > 400:
                    buy_plot_once(200)

        elif strategy == "B":
            if season == "Spring":
                # Never buy more enslaved workers. Buy land aggressively.
                buy_plot_if_affordable(100)

        next_pid = nonlocal_next_pid[0]

        # ── Rotation: mark plots to rest if soil below threshold ───────────
        active_fallow = [p for p in plots if p.state == "fallow" and not p.resting]
        for p in active_fallow:
            # Only rest if we have enough other plots to stay productive
            other_active = [q for q in active_fallow if q.id != p.id and not q.resting]
            if p.soil < FALLOW_SOIL_THRESHOLD and len(other_active) >= enslaved - 1:
                p.resting = True

        # ── Season resolution ──────────────────────────────────────────────

        if season == "Spring":
            plantable = [p for p in plots if p.state == "fallow" and not p.resting]
            # 1 worker per plot; keep 1 for maintenance if possible
            to_plant = min(len(plantable), max(0, enslaved - 1))
            to_plant = min(to_plant, len(plantable))
            for p in plantable[:to_plant]:
                p.state = "planted"
                p.resting = False
            maint = enslaved - to_plant
            money += maint * HIREOUT_INCOME

        elif season == "Summer":
            curr_planted = [p for p in plots if p.state == "planted"]
            if curr_planted:
                full_cov = len(curr_planted) * WORKERS_PER_PLOT_FULL_TEND
                tend_w = min(enslaved, math.ceil(full_cov))
                maint = enslaved - tend_w
                if full_cov > 0:
                    mod = clamp(tend_w / full_cov, 0.3, 1.0)
                else:
                    mod = 1.0
                for p in curr_planted:
                    p.yield_mod = mod
                    p.state = "tended"
                money += maint * HIREOUT_INCOME
            else:
                money += enslaved * HIREOUT_INCOME

        elif season == "Fall":
            ready = [p for p in plots if p.state in ("tended", "planted")]
            harv_w = min(enslaved, len(ready))
            maint = enslaved - harv_w
            for p in ready[:harv_w]:
                raw = math.floor(BASE_YIELD_PER_PLOT * (p.soil / 100) * p.yield_mod)
                raw_tobacco += raw
                p.soil = max(0, p.soil - SOIL_DEGRADE_PER_HARVEST)
                p.state = "fallow"
                p.yield_mod = 1.0
            for p in ready[harv_w:]:
                p.state = "fallow"
                p.yield_mod = 1.0
            money += maint * HIREOUT_INCOME

        elif season == "Winter":
            # Sell all cured tobacco before paying costs
            if cured_tobacco > 0:
                revenue = (cured_tobacco * get_price(year)) / 100.0
                money += revenue
                cured_tobacco = 0

            # Determine curing workforce
            if strategy == "B":
                # Hire free workers to cover whatever permanent workers can't
                workers_needed = math.ceil(raw_tobacco / CURING_CAPACITY_PER_WORKER)
                free_needed = max(0, workers_needed - enslaved)
                free_cost = free_needed * FREE_WORKER_WAGE
                if money >= free_cost:
                    money -= free_cost
                    curing_w = enslaved + free_needed
                else:
                    # Afford what we can
                    affordable = int(money // FREE_WORKER_WAGE)
                    money -= affordable * FREE_WORKER_WAGE
                    curing_w = enslaved + affordable
            else:
                # Strategy A: use permanent workers only (maybe hire 1 free to avoid rot)
                can_cure = enslaved * CURING_CAPACITY_PER_WORKER
                if raw_tobacco > can_cure and money >= FREE_WORKER_WAGE:
                    free_needed = math.ceil((raw_tobacco - can_cure) / CURING_CAPACITY_PER_WORKER)
                    free_cost = free_needed * FREE_WORKER_WAGE
                    if money >= free_cost:
                        money -= free_cost
                        curing_w = enslaved + free_needed
                    else:
                        curing_w = enslaved
                else:
                    curing_w = enslaved

            can_cure = curing_w * CURING_CAPACITY_PER_WORKER
            raw_used = min(raw_tobacco, can_cure)
            rotted = raw_tobacco - raw_used
            total_rotted += rotted
            new_cured = math.floor(raw_used / CURING_RATIO)
            cured_tobacco += new_cured
            raw_tobacco = 0

            # Winter maintenance (workers not on curing)
            maint_w = max(0, enslaved - min(curing_w, enslaved))
            if maint_w > 0 and plots:
                restore_total = maint_w * SOIL_RESTORE_PER_WORKER
                restore_per_plot = restore_total / len(plots)
                for p in plots:
                    p.soil = clamp(p.soil + restore_per_plot, 0, 100)

            # Upkeep for enslaved workers
            money -= enslaved * ENSLAVED_UPKEEP

        # ── Passive fallow recovery (every season) ────────────────────────
        for p in plots:
            if p.state == "fallow" and p.soil < FALLOW_RECOVERY_CAP:
                p.soil = clamp(p.soil + FALLOW_RECOVERY_PER_SEASON, 0, FALLOW_RECOVERY_CAP)

        # ── Debt / game-over check ────────────────────────────────────────
        if money < 0:
            debt_seasons += 1
            if debt_seasons >= DEBT_FORECLOSURE_SEASONS and cured_tobacco == 0 and raw_tobacco == 0:
                log_turn(season, {"event": "GAME_OVER"})
                return history, {"outcome": "GAME OVER", "year": year, "season": season,
                                 "money": money, "enslaved": enslaved, "plots": len(plots),
                                 "total_rotted": total_rotted}
        else:
            debt_seasons = 0

        log_turn(season)

        # ── Advance calendar ──────────────────────────────────────────────
        season_idx = (season_idx + 1) % 4
        if season_idx == 0:
            year += 1

    return history, {"outcome": "TIME_LIMIT", "year": year, "season": SEASONS[season_idx],
                     "money": money, "enslaved": enslaved, "plots": len(plots),
                     "total_rotted": total_rotted}


# ── Reporting ──────────────────────────────────────────────────────────────

def print_strategy(label: str, history: list[dict], final: dict):
    W = 74

    print(f"\n{'━' * W}")
    print(f"  STRATEGY {label}")
    print(f"{'━' * W}")

    outcome = final["outcome"]
    print(f"  Outcome  : {outcome}")
    print(f"  Ended    : {final['year']} {final['season']}")
    print(f"  Money    : ${final['money']:.2f}")
    print(f"  Workers  : {final['enslaved']} enslaved")
    print(f"  Plots    : {final['plots']}")
    print(f"  Rotted   : {final['total_rotted']:,} lbs raw")

    print(f"\n  {'Season':<18} {'$End':>8}  {'W':>3}  {'P':>3}  {'AvgSoil':>7}  {'MinSoil':>7}  {'Raw':>6}  {'Cured':>6}  Notes")
    print(f"  {'-'*18} {'-'*8}  {'-'*3}  {'-'*3}  {'-'*7}  {'-'*7}  {'-'*6}  {'-'*6}  -----")

    prev_enslaved = STARTING_ENSLAVED
    prev_plots = STARTING_PLOTS

    for t in history:
        label2 = f"{t['year']} {t['season']}"
        notes = []
        if t.get("event") == "VICTORY":
            notes.append("VICTORY")
        elif t.get("event") == "GAME_OVER":
            notes.append("GAME OVER")
        if t["debt"] > 0:
            notes.append(f"debt={t['debt']}")
        if t["enslaved"] > prev_enslaved:
            notes.append(f"+{t['enslaved']-prev_enslaved}w (${ENSLAVED_COST*(t['enslaved']-prev_enslaved)})")
        if t["plots"] > prev_plots:
            notes.append(f"+{t['plots']-prev_plots}p (${PLOT_COST*(t['plots']-prev_plots)})")
        prev_enslaved = t["enslaved"]
        prev_plots = t["plots"]
        note_str = "  ".join(notes)
        print(f"  {label2:<18} ${t['money']:>7.2f}  {t['enslaved']:>3}  {t['plots']:>3}  {t['avg_soil']:>7.1f}  {t['min_soil']:>7.1f}  {t['raw']:>6}  {t['cured']:>6}  {note_str}")


def print_comparison(hist_a, final_a, hist_b, final_b):
    W = 74
    print(f"\n{'═' * W}")
    print(f"  HEAD-TO-HEAD COMPARISON")
    print(f"{'═' * W}")
    print(f"  {'Metric':<30}  {'Strategy A':>15}  {'Strategy B':>15}")
    print(f"  {'-'*30}  {'-'*15}  {'-'*15}")

    def metric(name, va, vb):
        print(f"  {name:<30}  {va:>15}  {vb:>15}")

    metric("Outcome", final_a["outcome"], final_b["outcome"])
    metric("End year/season", f"{final_a['year']} {final_a['season']}", f"{final_b['year']} {final_b['season']}")
    metric("Final money", f"${final_a['money']:.2f}", f"${final_b['money']:.2f}")
    metric("Final enslaved workers", str(final_a["enslaved"]), str(final_b["enslaved"]))
    metric("Final plots", str(final_a["plots"]), str(final_b["plots"]))
    metric("Raw tobacco rotted", f"{final_a['total_rotted']:,} lbs", f"{final_b['total_rotted']:,} lbs")

    # Count debt seasons
    debt_a = sum(1 for t in hist_a if t["debt"] > 0)
    debt_b = sum(1 for t in hist_b if t["debt"] > 0)
    metric("Debt seasons", str(debt_a), str(debt_b))

    # Minimum money reached
    min_a = min(t["money"] for t in hist_a)
    min_b = min(t["money"] for t in hist_b)
    metric("Lowest money reached", f"${min_a:.2f}", f"${min_b:.2f}")

    # Total cured ever produced (harvest seasons only)
    # Approximate: track money gains from selling
    print()
    print(f"  NOTE: Strategy B hires free workers every Winter for curing.")
    print(f"  Free worker cost = ${FREE_WORKER_WAGE}/worker/season (no upfront, gone next season).")
    print(f"  Enslaved worker  = ${ENSLAVED_COST} upfront + ${ENSLAVED_UPKEEP}/winter ongoing.")


def main():
    print(f"\n{'═' * 74}")
    print(f"  THE PECULIAR INSTITUTION — Strategy Simulation")
    print(f"  Starting: ${STARTING_MONEY}  |  {STARTING_ENSLAVED} enslaved  |  {STARTING_PLOTS} plot")
    print(f"{'═' * 74}")

    hist_a, final_a = simulate("A")
    hist_b, final_b = simulate("B")

    print_strategy("A — Standard (buy workers + land gradually)", hist_a, final_a)
    print_strategy("B — Land-heavy (4 workers, free-curing every Winter)", hist_b, final_b)
    print_comparison(hist_a, final_a, hist_b, final_b)

    print(f"\n{'═' * 74}\n")


if __name__ == "__main__":
    main()
