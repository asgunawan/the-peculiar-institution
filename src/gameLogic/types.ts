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

export type CropType = "tobacco" | "provision";

export interface Plot {
  id: number;
  name: string;
  soilHealth: number;
  cropType: CropType;
  state: PlotState;
  yieldModifier: number;
  resting: boolean;
}

export type BuildingType = "quarter_cabin" | "tool_shed";

export interface Building {
  id: number;
  type: BuildingType;
  builtYear: number;
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
  readonly season?: SeasonName;
  money: number;
  workers: Worker[];
  plots: Plot[];
  buildings: Building[];
  resources: Resources;
  assignments: Assignments;
  log: LogEntry[];
  logCounter: number;
  debtSeasons: number;
  maintenanceTarget: number;
  gameOver: boolean;
  victory: boolean;
  pendingFlavorText: string | null;
  seenMilestones: string[];
  priceModifier: number;
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