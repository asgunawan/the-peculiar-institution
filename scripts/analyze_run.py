#!/usr/bin/env python3
"""
analyze_run.py — Playthrough analysis for The Peculiar Institution.

Usage:
    python scripts/analyze_run.py <path-to-run-log.json>

The JSON file is downloaded from the browser via: window.downloadRunLog()
"""

import json
import sys
from pathlib import Path


# ── Helpers ──────────────────────────────────────────────────────────────────

def avg(values):
    return sum(values) / len(values) if values else 0.0

def pct(part, total):
    return f"{100 * part / total:.0f}%" if total else "—"

def bar(value, max_value=100, width=20):
    filled = round(width * value / max_value) if max_value else 0
    return "█" * filled + "░" * (width - filled)


# ── Loaders ──────────────────────────────────────────────────────────────────

def load(path: str) -> list[dict]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, list) or not data:
        sys.exit("Error: JSON file is empty or not a season log array.")
    return data


# ── Section printers ─────────────────────────────────────────────────────────

def section(title: str):
    print(f"\n{'━' * 60}")
    print(f"  {title}")
    print('━' * 60)


def print_run_summary(log: list[dict]):
    section("RUN SUMMARY")
    first = log[0]
    last = log[-1]
    outcome = "ongoing"
    if last["after"]["victory"]:
        outcome = "VICTORY 🏆"
    elif last["after"]["gameOver"]:
        outcome = "GAME OVER 💀"

    print(f"  Outcome     : {outcome}")
    print(f"  Seasons     : {len(log)}")
    print(f"  Year range  : {first['year']} → {last['year']} ({last['season']})")
    print(f"  Start money : ${first['before']['money']:.2f}")
    print(f"  End money   : ${last['after']['money']:.2f}")
    net = last["after"]["money"] - first["before"]["money"]
    print(f"  Net profit  : ${net:+.2f}")
    print(f"  Final workers : {last['after']['workers']}")
    print(f"  Final plots   : {len(last['after']['plots'])}")


def print_economy_timeline(log: list[dict]):
    section("ECONOMY TIMELINE")
    print(f"  {'Season':<18} {'$Start':>8} {'$End':>8} {'Δ':>8}  Debt")
    print(f"  {'-'*18} {'-'*8} {'-'*8} {'-'*8}  ----")
    for entry in log:
        label = f"{entry['year']} {entry['season']}"
        m_start = entry["before"]["money"]
        m_end = entry["after"]["money"]
        delta = m_end - m_start
        debt = entry["after"]["debtSeasons"]
        debt_str = f"⚠ {debt}" if debt > 0 else ""
        flag = " ◄ BOUGHT" if entry["after"]["workers"] > entry["before"]["workers"] or len(entry["after"]["plots"]) > len(entry["before"]["plots"]) else ""
        print(f"  {label:<18} ${m_start:>7.2f} ${m_end:>7.2f} ${delta:>+7.2f}  {debt_str:<6}{flag}")


def print_workforce_land(log: list[dict]):
    section("WORKFORCE & LAND GROWTH")
    last_w = log[0]["before"]["workers"]
    last_p = len(log[0]["before"]["plots"])
    print(f"  Start: {last_w} workers, {last_p} plot(s)")

    for entry in log:
        w_after = entry["after"]["workers"]
        p_after = len(entry["after"]["plots"])
        label = f"{entry['year']} {entry['season']}"
        if w_after != last_w:
            print(f"  {label:<18} workers {last_w} → {w_after}  (cost ~${(w_after-last_w)*200:.0f})")
            last_w = w_after
        if p_after != last_p:
            print(f"  {label:<18} plots   {last_p} → {p_after}  (cost ~${(p_after-last_p)*150:.0f})")
            last_p = p_after

    print(f"  Final: {last_w} workers, {last_p} plot(s)")


def print_soil_health(log: list[dict]):
    section("SOIL HEALTH TRENDS")
    print(f"  {'Season':<18} {'Plots':>5}  {'Avg':>5}  {'Min':>5}  Bar")
    print(f"  {'-'*18} {'-'*5}  {'-'*5}  {'-'*5}  ---")
    for entry in log:
        plots = entry["after"]["plots"]
        if not plots:
            continue
        healths = [p["soilHealth"] for p in plots]
        avg_h = avg(healths)
        min_h = min(healths)
        label = f"{entry['year']} {entry['season']}"
        warn = " ⚠" if min_h < 30 else (" ·" if min_h < 60 else "  ")
        print(f"  {label:<18} {len(plots):>5}  {avg_h:>5.1f}  {min_h:>5.0f}  {bar(avg_h)}{warn}")


def print_assignment_patterns(log: list[dict]):
    section("ASSIGNMENT PATTERNS (workers per task)")
    tasks = ["planting", "tending", "harvesting", "curing", "maintenance"]
    header_tasks = [t[:6].rjust(7) for t in tasks]
    print(f"  {'Season':<18} {'W':>3}  {'P':>3} " + "".join(header_tasks))
    print(f"  {'-'*18} {'-'*3}  {'-'*3} " + "  -----" * len(tasks))

    for entry in log:
        label = f"{entry['year']} {entry['season']}"
        w = entry["before"]["workers"]
        p = len(entry["before"]["plots"])
        a = entry["before"]["assignments"]
        vals = "".join(f"{a.get(t, 0):>7}" for t in tasks)
        total_assigned = sum(a.get(t, 0) for t in tasks)
        unassigned = max(0, w - total_assigned)
        flag = f"  ← {unassigned} idle" if unassigned > 0 else ""
        print(f"  {label:<18} {w:>3}  {p:>3} {vals}{flag}")


def print_production_analysis(log: list[dict]):
    section("PRODUCTION ANALYSIS")

    fall_entries = [e for e in log if e["season"] == "Fall"]
    winter_entries = [e for e in log if e["season"] == "Winter"]

    print("\n  FALL HARVEST")
    print(f"  {'Season':<18} {'Plots':>5}  {'Raw lbs':>8}  {'lbs/plot':>9}  {'Avg soil':>9}")
    print(f"  {'-'*18} {'-'*5}  {'-'*8}  {'-'*9}  {'-'*9}")
    for entry in fall_entries:
        raw_before = entry["before"]["resources"]["rawTobacco"]
        raw_after = entry["after"]["resources"]["rawTobacco"]
        raw_gained = raw_after - raw_before
        plots = entry["before"]["plots"]
        n_plots = len(plots)
        per_plot = raw_gained / n_plots if n_plots else 0
        avg_soil = avg([p["soilHealth"] for p in plots]) if plots else 0
        label = f"{entry['year']} {entry['season']}"
        print(f"  {label:<18} {n_plots:>5}  {raw_gained:>8,}  {per_plot:>9.0f}  {avg_soil:>9.1f}")

    print("\n  WINTER CURING")
    print(f"  {'Season':<18} {'Raw in':>7}  {'Cured out':>9}  {'Efficiency':>10}  {'Rotted':>7}")
    print(f"  {'-'*18} {'-'*7}  {'-'*9}  {'-'*10}  {'-'*7}")
    for entry in winter_entries:
        raw_in = entry["before"]["resources"]["rawTobacco"]
        cured_before = entry["before"]["resources"]["curedTobacco"]
        cured_after = entry["after"]["resources"]["curedTobacco"]
        raw_after = entry["after"]["resources"]["rawTobacco"]
        cured_gained = max(0, cured_after - cured_before)
        raw_used = cured_gained * 2  # CURING_RATIO = 2
        rotted = max(0, raw_in - raw_used - raw_after)
        efficiency = raw_used / raw_in if raw_in > 0 else 0
        label = f"{entry['year']} {entry['season']}"
        print(f"  {label:<18} {raw_in:>7,}  {cured_gained:>9,}  {pct(raw_used, raw_in):>10}  {rotted:>7,}")


def print_observations(log: list[dict]):
    section("KEY OBSERVATIONS")
    notes = []

    # Debt streaks
    max_debt = max(e["after"]["debtSeasons"] for e in log)
    if max_debt >= 2:
        notes.append(f"⚠  Hit {max_debt} consecutive debt season(s) — close to foreclosure.")

    # Soil bottom
    all_soils = [p["soilHealth"] for e in log for p in e["after"]["plots"]]
    if all_soils:
        min_soil = min(all_soils)
        if min_soil < 20:
            notes.append(f"⚠  Soil hit {min_soil:.0f} — severe depletion on at least one plot.")
        elif min_soil < 40:
            notes.append(f"·  Soil dipped to {min_soil:.0f} — watch maintenance allocation.")

    # Curing losses
    winter_entries = [e for e in log if e["season"] == "Winter"]
    total_rotted = 0
    for e in winter_entries:
        raw_in = e["before"]["resources"]["rawTobacco"]
        cured_gained = max(0, e["after"]["resources"]["curedTobacco"] - e["before"]["resources"]["curedTobacco"])
        raw_used = cured_gained * 2
        raw_after = e["after"]["resources"]["rawTobacco"]
        total_rotted += max(0, raw_in - raw_used - raw_after)
    if total_rotted > 0:
        notes.append(f"·  {total_rotted:,} lbs of raw tobacco rotted across all winters — curing workers undersupplied.")

    # Idle workers
    idle_seasons = []
    tasks = ["planting", "tending", "harvesting", "curing", "maintenance"]
    for e in log:
        a = e["before"]["assignments"]
        total_assigned = sum(a.get(t, 0) for t in tasks)
        idle = max(0, e["before"]["workers"] - total_assigned)
        if idle > 0:
            idle_seasons.append((f"{e['year']} {e['season']}", idle))
    if idle_seasons:
        notes.append(f"·  {len(idle_seasons)} season(s) had idle workers: " +
                     ", ".join(f"{s} ({n} idle)" for s, n in idle_seasons[:4]) +
                     ("..." if len(idle_seasons) > 4 else ""))

    # Soil recovery trend: compare first vs last avg
    first_soil = avg([p["soilHealth"] for p in log[0]["before"]["plots"]])
    last_soil = avg([p["soilHealth"] for p in log[-1]["after"]["plots"]])
    soil_delta = last_soil - first_soil
    if soil_delta < -10:
        notes.append(f"·  Net soil health trend: {soil_delta:+.1f} pts — maintenance may be underfunded long-term.")
    elif soil_delta > 10:
        notes.append(f"✓  Net soil health trend: {soil_delta:+.1f} pts — good maintenance discipline.")

    # Worker vs plot ratio at end
    last = log[-1]["after"]
    w_p_ratio = last["workers"] / max(1, len(last["plots"]))
    if w_p_ratio < 2:
        notes.append(f"·  Final worker/plot ratio {w_p_ratio:.1f} — may be plot-heavy relative to labour.")
    elif w_p_ratio > 4:
        notes.append(f"·  Final worker/plot ratio {w_p_ratio:.1f} — workers may be underutilized on land.")

    # Money trend in second half
    mid = len(log) // 2
    late_log = log[mid:]
    late_money_start = late_log[0]["before"]["money"]
    late_money_end = late_log[-1]["after"]["money"]
    late_delta = late_money_end - late_money_start
    if late_delta > 100:
        notes.append(f"✓  Late-game money grew by ${late_delta:+.2f} — snowball detected.")
    elif late_delta < -50:
        notes.append(f"⚠  Late-game money fell by ${abs(late_delta):.2f} — mounting financial pressure.")

    if not notes:
        notes.append("✓  No major issues detected.")

    for note in notes:
        print(f"  {note}")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    log = load(sys.argv[1])

    print(f"\n{'═' * 60}")
    print(f"  THE PECULIAR INSTITUTION — Run Analysis")
    print(f"  Log: {sys.argv[1]}  ({len(log)} seasons)")
    print('═' * 60)

    print_run_summary(log)
    print_economy_timeline(log)
    print_workforce_land(log)
    print_soil_health(log)
    print_assignment_patterns(log)
    print_production_analysis(log)
    print_observations(log)

    print(f"\n{'═' * 60}\n")


if __name__ == "__main__":
    main()
