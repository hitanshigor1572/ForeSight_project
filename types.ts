
export type BusinessType = string;
export type AreaType = string;
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type SeasonType = 'Low' | 'Normal' | 'High';

export interface Product {
  id: string;
  name: string;
  price: number;
  costPerUnit: number;
  salesVolumeShare: number; // percentage of total daily customers buying this
}

export interface Shock {
  name: string;
  amount: number;
  frequency: 'one-time' | 'monthly';
}

export interface SeasonConfig {
  month: string;
  type: SeasonType;
}

export interface BusinessConfig {
  id: string;
  name: string;
  type: BusinessType;
  area: AreaType;
  rent: number;
  avgCustomers: number; // Base daily customers
  initialCash: number;
  currency: string;
  salaries: number;
  marketingSpend: number;
  products: Product[];
  seasons: SeasonConfig[];
  shocks: Shock[];
  opportunityCostJob: number;
  opportunityCostFD: number; // Annual % return
  avgBill: number;
  variableCostPercent: number;
}

export interface SimulationResult {
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  breakEvenMonths: number;
  riskLevel: RiskLevel;
  cashSurvivalMonths: number;
  projections: ForecastPoint[];
  minSalesToSurvive: number;
  lossRecoveryMonths: number;
  dependencyRiskScore: number; 
  opportunityCostLoss: number;
}

export interface ForecastPoint {
  month: string;
  revenue: number;
  expenses: number;
  cash: number;
  profit: number;
  riskScore: number;
}

export interface AISummary {
  explanation: string;
  recommendations: string[];
  riskAnalysis: string;
  advisorVerdict: 'Continue' | 'Improve' | 'Exit / Pivot';
}

export interface Scenario {
  id: string;
  name: string;
  config: BusinessConfig;
  result: SimulationResult;
  timestamp: number;
}

export interface Item {
  id: string;
  name: string;
  category?: string;
  costPrice: number;
  sellingPrice: number;
  openingStock: number;
  currentStock: number; // Tracks actual stock after sales
  unit: string; // pcs, kg, litre, etc.
  offer?: {
    enabled: boolean;
    type: 'percentage' | 'flat';
    value: number;
  };
}

export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  itemId?: string; // Reference to Item (if using items system)
  productName: string; // Fallback for manual entries
  quantitySold: number;
  sellingPrice: number;
  expense?: number;
}

export interface MonthFolder {
  id: string;
  monthKey: string; // Format: "YYYY-MM" (e.g., "2025-01")
  displayName: string; // Format: "Jan 2025"
  entries: DailyEntry[];
}
