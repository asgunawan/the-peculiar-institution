import type { SeasonName } from "../gameLogic/types";

const SEASON_SUBTITLES: Record<SeasonName, string> = {
  Spring: "Assign workers to planting.",
  Summer: "Assign workers to tending the fields.",
  Fall: "Assign workers to harvesting.",
  Winter: "Split workers between curing and maintenance.",
};

interface GameHeaderProps {
  year: number;
  season: SeasonName;
  money: number;
}

export default function GameHeader({ year, season, money }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="header-top">
        <div className="header-date">
          <span className="season-label">{season}</span>
          <span className="year-label">{year}</span>
        </div>
        <div className="header-money">
          <span className="money-label">Treasury</span>
          <span className={`money-value ${money < 100 ? "money-low" : ""}`}>${money.toFixed(0)}</span>
        </div>
      </div>
      <p className="header-subtitle">{SEASON_SUBTITLES[season]}</p>
    </header>
  );
}