
import React, { useState, useEffect } from 'react';
import { BusinessConfig, SimulationResult } from '../types';
import { calculateFinancials, simulatePriceImpact } from '../services/engine';
import { RotateCcw, Save, TrendingDown, TrendingUp } from 'lucide-react';

interface DecisionSimulatorProps {
  initialConfig: BusinessConfig;
  onSaveScenario: (config: BusinessConfig, result: SimulationResult) => void;
}

const DecisionSimulator: React.FC<DecisionSimulatorProps> = ({ initialConfig, onSaveScenario }) => {
  const [simConfig, setSimConfig] = useState<BusinessConfig>({ ...initialConfig });
  const [simResult, setSimResult] = useState<SimulationResult>(calculateFinancials(initialConfig));
  const [baseResult] = useState<SimulationResult>(calculateFinancials(initialConfig));

  useEffect(() => {
    setSimResult(calculateFinancials(simConfig));
  }, [simConfig]);

  const handlePriceChange = (id: string, newPrice: number) => {
    const updatedProducts = simConfig.products.map(p => {
      if (p.id === id) {
        return { ...p, price: newPrice };
      }
      return p;
    });
    // Setting avgBill to 0 ensures engine falls back to the products array for granular sandbox simulation
    setSimConfig({ ...simConfig, products: updatedProducts, avgBill: 0 });
  };

  const getDiff = (key: 'monthlyProfit' | 'breakEvenMonths' | 'minSalesToSurvive') => {
    const current = simResult[key];
    const base = baseResult[key];
    const diff = current - base;
    if (Math.abs(diff) < 0.1) return null;

    const isGood = key === 'monthlyProfit' ? diff > 0 : diff < 0;
    return (
      <div className={`flex items-center text-[10px] font-bold ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
        {diff > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(diff).toLocaleString()} {key === 'breakEvenMonths' ? 'mo' : ''}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Advanced Sandbox</h2>
          <p className="text-sm text-slate-500">Includes Price Elasticity and Dependency analysis.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSimConfig({ ...initialConfig })} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg flex items-center gap-2 text-sm transition-colors"><RotateCcw className="w-4 h-4" /> Reset</button>
          <button onClick={() => onSaveScenario(simConfig, simResult)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 text-sm shadow-sm hover:bg-indigo-700 transition-colors"><Save className="w-4 h-4" /> Save</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        <div className="space-y-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust Variables</h3>
          
          {simConfig.products.map(product => {
            // Anchor range boundaries to initial configuration to prevent dynamic range shifting (the "jumping thumb" bug)
            const initialProduct = initialConfig.products.find(p => p.id === product.id) || product;
            const minBound = Math.round(initialProduct.price * 0.2);
            const maxBound = Math.round(initialProduct.price * 3.0);
            
            return (
              <div key={product.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block">{product.name}</label>
                    <span className="text-[10px] text-slate-400 font-medium">Price Adjustment</span>
                  </div>
                  <div className="bg-white px-3 py-1 rounded-lg border border-slate-200">
                    <span className="text-sm font-bold text-indigo-600">{simConfig.currency}{product.price.toLocaleString()}</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min={minBound} 
                  max={maxBound} 
                  step="5"
                  value={product.price}
                  onChange={(e) => handlePriceChange(product.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                  <span>Min ({simConfig.currency}{minBound})</span>
                  <span>Max ({simConfig.currency}{maxBound})</span>
                </div>
                <p className="text-[10px] text-slate-500 italic leading-relaxed">
                  Note: Higher prices reduce volume, while lower prices attract more customers (Elasticity applied).
                </p>
              </div>
            );
          })}

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-bold text-slate-700 block">Base Footfall</label>
                <span className="text-[10px] text-slate-400 font-medium">Daily Customer Flow</span>
              </div>
              <div className="bg-white px-3 py-1 rounded-lg border border-slate-200">
                <span className="text-sm font-bold text-indigo-600">{simConfig.avgCustomers} <span className="text-[10px] text-slate-400">cust/d</span></span>
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max={Math.max(100, initialConfig.avgCustomers * 4)}
              value={simConfig.avgCustomers}
              onChange={(e) => {
                setSimConfig({ ...simConfig, avgCustomers: parseInt(e.target.value), avgBill: 0 });
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>Low Traffic</span>
              <span>High Traffic</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-2xl space-y-8 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <TrendingUp className="w-48 h-48" />
          </div>
          
          <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold z-10">Live Simulation Impact</h4>
          
          <div className="grid grid-cols-1 gap-8 z-10">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Projected Monthly Profit</span>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-black">{simConfig.currency}{simResult.monthlyProfit.toLocaleString()}</p>
                {getDiff('monthlyProfit')}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-1 font-bold uppercase">Survival Goal</span>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{simResult.minSalesToSurvive}</p>
                    {getDiff('minSalesToSurvive')}
                  </div>
                  <span className="text-[9px] text-slate-500">Customers needed / day</span>
               </div>
               <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-1 font-bold uppercase">Dependency Risk</span>
                  <p className="text-xl font-bold">{simResult.dependencyRiskScore}%</p>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full ${simResult.dependencyRiskScore > 70 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${simResult.dependencyRiskScore}%` }} />
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 z-10">
             <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-xs leading-relaxed text-indigo-100">
                   {simResult.monthlyProfit > baseResult.monthlyProfit 
                    ? "Strategy Analysis: Your current adjustments are improving profitability. Ensure your team can handle the projected increase in demand."
                    : "Strategy Analysis: Profit margins are narrowing. You may need to optimize fixed overheads or find higher-margin add-on products."}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionSimulator;
