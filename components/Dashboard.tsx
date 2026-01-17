
import React from 'react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Line,
  Bar,
  ComposedChart,
  Legend
} from 'recharts';
import { BusinessConfig, SimulationResult } from '../types';
import KpiCard from './KpiCard';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  DollarSign, 
  Target, 
  LifeBuoy, 
  Zap, 
  Info,
  XCircle,
  AlertCircle,
  Flame
} from 'lucide-react';

interface DashboardProps {
  config: BusinessConfig;
  result: SimulationResult;
}

const Dashboard: React.FC<DashboardProps> = ({ config, result }) => {
  const { currency } = config;

  const riskColor = result.riskLevel === 'High' ? 'red' : result.riskLevel === 'Medium' ? 'yellow' : 'green';
  const riskIcon = result.riskLevel === 'High' ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />;

  const minCash = Math.min(...result.projections.map(p => p.cash));
  const isInsolvent = minCash < 0;
  const sortedByProfit = [...result.projections].sort((a, b) => b.profit - a.profit);
  const bestMonth = sortedByProfit[0];
  const worstMonth = [...result.projections].sort((a, b) => a.cash - b.cash)[0];

  const getRiskStatus = () => {
    if (isInsolvent) return { label: 'CRITICAL RISK', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: <XCircle className="w-4 h-4" /> };
    if (result.cashSurvivalMonths !== -1 && result.cashSurvivalMonths < 6) return { label: 'HIGH RISK', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Zap className="w-4 h-4" /> };
    return { label: 'HEALTHY', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <ShieldCheck className="w-4 h-4" /> };
  };

  const riskStatus = getRiskStatus();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Critical Alert Banner */}
      {isInsolvent && (
        <div className="bg-rose-600 text-white p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-rose-200 border border-rose-500 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg">Insolvency Detected</h4>
              <p className="text-rose-100 text-xs font-medium">Your business is projected to run out of cash by Month {result.cashSurvivalMonths}.</p>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-sm font-bold">
            Projected Deficit: {currency}{Math.abs(minCash).toLocaleString()}
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Projected Profit" 
          value={`${currency}${result.monthlyProfit.toLocaleString()}`} 
          subtitle={result.monthlyProfit < 0 ? "Negative cash flow" : "Average monthly net"}
          icon={result.monthlyProfit < 0 ? <Flame className="text-rose-500" /> : <DollarSign className="w-4 h-4" />} 
          color={result.monthlyProfit > 0 ? (result.opportunityCostLoss > 0 ? "yellow" : "green") : "red"}
        />
        <KpiCard 
          title="Survival Threshold" 
          value={`${result.minSalesToSurvive}`} 
          subtitle="Customers / Day needed"
          icon={<Target className="w-4 h-4" />} 
          color="slate"
        />
        <KpiCard 
          title="Cash Runway" 
          value={result.cashSurvivalMonths === -1 ? 'Sustainable' : `${result.cashSurvivalMonths} Mo`} 
          subtitle={result.cashSurvivalMonths === -1 ? "Infinite liquidity" : "Time to insolvency"}
          icon={<LifeBuoy className="w-4 h-4" />} 
          color={result.cashSurvivalMonths < 6 && result.cashSurvivalMonths !== -1 ? "red" : "blue"}
        />
        <KpiCard 
          title="Risk Rating" 
          value={result.riskLevel} 
          subtitle="Operational Stability"
          icon={riskIcon} 
          color={riskColor}
        />
      </div>

      {/* Forecast Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">12-Month Performance</h3>
            <p className="text-xs text-slate-500">Revenue vs Operating Expenses</p>
          </div>
          <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100 text-[10px] font-bold text-slate-400 uppercase">Seasonality Applied</div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={result.projections}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                formatter={(value: number) => [`${currency}${value.toLocaleString()}`, '']}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar name="Revenue" dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar name="Expenses" dataKey="expenses" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={14} />
              <Line name="Profit" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
