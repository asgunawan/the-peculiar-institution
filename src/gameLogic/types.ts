export type SeasonName = "Spring" | "Summer" | "Fall" | "Winter";

export type TaskName =
  | "planting"
  | "tending"
  | "harvesting"
  | "curing"
  | "maintenance";

export type WorkerType = "enslaved" | "free";

export interface Worker {
  id: number;
  type: WorkerType;
}

export type PlotState = "fallow" | "planted" | "tended";

export interface Plot {
  id: number;
  name: string;
  soilHealth: number;
  cropType: "tobacco";
  state: PlotState;
  yieldModifier: number;
  resting: boolean;
}

export interface Resources {
  rawTobacco: number;
  curedTobacco: number;
}

export interface Assignments {
  planting: number;
  tending: number;
  harvesting: number;
  curing: number;
  maintenance: number;
}

export interface LogEntry {
  id: number;
  text: string;
}

export interface GameState {
  year: number;
  seasonIndex: number;
  readonly season: SeasonName;
  money: number;
  workers: Worker[];
  plots: Plot[];
  resources: Resources;
  assignments: Assignments;
  log: LogEntry[];
  logCounter: number;
  debtSeasons: number;
  maintenanceTarget: number;
  gameOver: boolean;
  victory: boolean;
}

export interface SavePayload {
  state: GameState;
  currentPrice: number;
  savedAt?: string;
  label?: string;
}

export interface SlotMeta {
  label: string;
  savedAt: string | null;
  year: number;
  seasonIndex: number;
}