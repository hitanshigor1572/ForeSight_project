
import { BusinessConfig, SimulationResult, ForecastPoint, RiskLevel, Product } from '../types';

const SEASON_MULTIPLIERS = { Low: 0.7, Normal: 1.0, High: 1.4 };

export const calculateFinancials = (config: BusinessConfig): SimulationResult => {
  const { rent, avgCustomers, salaries, marketingSpend, initialCash, products, seasons, shocks, opportunityCostJob, opportunityCostFD, avgBill, variableCostPercent } = config;

  const useSimplified = typeof avgBill === 'number' && avgBill > 0;
  
  const baseDailyRevenue = useSimplified 
    ? avgBill 
    : products.reduce((acc, p) => acc + (p.price * p.salesVolumeShare), 0);

  const baseDailyVariableCosts = useSimplified
    ? avgBill * (variableCostPercent / 100)
    : products.reduce((acc, p) => acc + (p.costPerUnit * p.salesVolumeShare), 0);
  
  const monthlyRevenueBase = baseDailyRevenue * avgCustomers * 30;
  const monthlyVariableCostsBase = baseDailyVariableCosts * avgCustomers * 30;
  const monthlyFixedCosts = rent + salaries + marketingSpend + shocks.reduce((acc, s) => s.frequency === 'monthly' ? acc + s.amount : acc, 0);

  const projections: ForecastPoint[] = [];
  let currentCash = initialCash;
  let totalAnnualProfit = 0;
  let firstInsolventMonthIdx = -1;

  seasons.forEach((season, idx) => {
    const mult = SEASON_MULTIPLIERS[season.type];
    const rev = monthlyRevenueBase * mult;
    const varCosts = monthlyVariableCostsBase * mult;
    const exp = varCosts + monthlyFixedCosts;
    const prof = rev - exp;
    currentCash += prof;
    totalAnnualProfit += prof;

    if (currentCash < 0 && firstInsolventMonthIdx === -1) {
      firstInsolventMonthIdx = idx + 1;
    }

    let riskScore = 0;
    if (prof < 0) riskScore += 40;
    if (currentCash < monthlyFixedCosts * 2) riskScore += 30;
    if (currentCash < 0) riskScore = 100;

    projections.push({
      month: season.month,
      revenue: Math.round(rev),
      expenses: Math.round(exp),
      profit: Math.round(prof),
      cash: Math.round(currentCash),
      riskScore: Math.min(riskScore, 100),
    });
  });

  const avgMonthlyProfit = totalAnnualProfit / 12;
  const marginPerCustomer = baseDailyRevenue - baseDailyVariableCosts;
  const minSalesToSurvive = marginPerCustomer > 0 ? monthlyFixedCosts / marginPerCustomer : 999;
  
  // Improved Survival Metric: First month negative or -1 if sustainable
  const cashSurvivalMonths = firstInsolventMonthIdx;

  const businessMonthlyProfit = avgMonthlyProfit;
  const fdMonthly = (initialCash * (opportunityCostFD / 100)) / 12;
  const totalAltIncome = opportunityCostJob + fdMonthly;
  const opportunityCostLoss = totalAltIncome - businessMonthlyProfit;

  let riskLevel: RiskLevel = 'Low';
  if (businessMonthlyProfit < 0 || (cashSurvivalMonths !== -1 && cashSurvivalMonths < 6)) riskLevel = 'High';
  else if (businessMonthlyProfit < totalAltIncome * 0.5) riskLevel = 'Medium';

  return {
    monthlyRevenue: Math.round(monthlyRevenueBase),
    monthlyExpenses: Math.round(monthlyVariableCostsBase + monthlyFixedCosts),
    monthlyProfit: Math.round(businessMonthlyProfit),
    breakEvenMonths: avgMonthlyProfit > 0 ? initialCash / avgMonthlyProfit : -1,
    riskLevel,
    cashSurvivalMonths,
    projections,
    minSalesToSurvive: Math.ceil(minSalesToSurvive),
    lossRecoveryMonths: avgMonthlyProfit > 0 && initialCash > currentCash ? (initialCash - currentCash) / avgMonthlyProfit : 0,
    dependencyRiskScore: 0, // Simplified for now
    opportunityCostLoss: Math.round(opportunityCostLoss),
  };
};

export const simulatePriceImpact = (product: Product, newPrice: number): number => {
  const percentChange = (newPrice - product.price) / product.price;
  const elasticity = -1.5;
  return Math.max(0.1, 1 + (percentChange * elasticity));
};
