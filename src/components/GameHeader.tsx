import type { SeasonName } from "../gameLogic/types";

interface GameHeaderProps {
  year: number;
  season: SeasonName;
  money: number;
  subtitle: string;
  onDismissSubtitle?: () => void;
}

export default function GameHeader({ year, season, money, subtitle, onDismissSubtitle }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="header-top">
        <div className="header-date">
          <span className="season-label">{season}</span>
          <span className="year-label">{year}</span>
        </div>
        <div className="header-subtitle-area">
          <p className="header-subtitle">{subtitle}</p>
          {onDismissSubtitle && (
            <button className="subtitle-dismiss" onClick={onDismissSubtitle} aria-label="Dismiss">×</button>
          )}
        </div>
        <div className="header-money">
          <span className="money-label">Treasury</span>
          <span className={`money-value ${money < 100 ? "money-low" : ""}`}>${money.toFixed(0)}</span>
        </div>
      </div>
    </header>
  );
}