
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  History, 
  Info,
  ChevronRight,
  Calculator,
  Rocket,
  BookOpen,
  Package,
  TrendingUp
} from 'lucide-react';
import { BusinessConfig, SimulationResult, AISummary, Scenario } from './types';
import { DEFAULT_CONFIG } from './constants';
import { calculateFinancials } from './services/engine';
import { getAIInsights } from './services/geminiService';
import BusinessSetup from './components/BusinessSetup';
import Dashboard from './components/Dashboard';
import AIInsightsPanel from './components/AIInsightsPanel';
import DecisionSimulator from './components/DecisionSimulator';
import DailyEntry from './components/DailyEntry';
import Items from './components/Items';
import StockPrediction from './components/StockPrediction';

type Tab = 'setup' | 'dashboard' | 'simulator' | 'history' | 'dailyEntry' | 'items' | 'stockPrediction';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('setup');
  const [config, setConfig] = useState<BusinessConfig>(() => {
    const saved = localStorage.getItem('foresight_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [result, setResult] = useState<SimulationResult>(calculateFinancials(config));
  const [insights, setInsights] = useState<AISummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<Scenario[]>(() => {
    const saved = localStorage.getItem('foresight_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('foresight_config', JSON.stringify(config));
    setResult(calculateFinancials(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('foresight_history', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = async () => {
    setAiLoading(true);
    const summary = await getAIInsights(config, result);
    setInsights(summary);
    setAiLoading(false);
  };

  const saveScenario = (simConfig: BusinessConfig, simResult: SimulationResult) => {
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: `Simulation - ${new Date().toLocaleTimeString()}`,
      config: simConfig,
      result: simResult,
      timestamp: Date.now()
    };
    setHistory(prev => [newScenario, ...prev]);
    alert("Scenario saved to history!");
  };

  const deleteScenario = (id: string) => {
    setHistory(prev => prev.filter(s => s.id !== id));
  };

  const restoreScenario = (scenario: Scenario) => {
    setConfig(scenario.config);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <img src="/Foresightlogo.jpeg" alt="FORESIGHT Logo" className="w-10 h-10 object-contain" />
          <span className="text-xl font-black text-slate-900 tracking-tight">FORESIGHT</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink icon={<Settings />} label="Business Setup" active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} />
          <SidebarLink icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarLink icon={<Package />} label="Items / Products" active={activeTab === 'items'} onClick={() => setActiveTab('items')} />
          <SidebarLink icon={<BookOpen />} label="Daily Entry" active={activeTab === 'dailyEntry'} onClick={() => setActiveTab('dailyEntry')} />
          <SidebarLink icon={<TrendingUp />} label="Stock Prediction" active={activeTab === 'stockPrediction'} onClick={() => setActiveTab('stockPrediction')} />
          <SidebarLink icon={<Calculator />} label="Decision Sandbox" active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} />
          <SidebarLink icon={<History />} label="Saved History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Simulated Health</p>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-600">Risk</span>
              <span className={`text-xs font-bold ${result.riskLevel === 'Low' ? 'text-emerald-500' : 'text-rose-500'}`}>{result.riskLevel}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${result.riskLevel === 'Low' ? 'bg-emerald-500 w-1/3' : result.riskLevel === 'Medium' ? 'bg-amber-500 w-2/3' : 'bg-rose-500 w-full'}`} 
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 p-4 fixed bottom-0 w-full z-50">
        <MobileNavLink icon={<Settings />} active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} />
        <MobileNavLink icon={<LayoutDashboard />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavLink icon={<Package />} active={activeTab === 'items'} onClick={() => setActiveTab('items')} />
        <MobileNavLink icon={<BookOpen />} active={activeTab === 'dailyEntry'} onClick={() => setActiveTab('dailyEntry')} />
        <MobileNavLink icon={<Calculator />} active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} />
        <MobileNavLink icon={<History />} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
      </nav>

      <main className="flex-1 p-4 md:p-10 mb-24 md:mb-0">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'setup' && 'Configuration'}
              {activeTab === 'dashboard' && 'Market Intelligence'}
              {activeTab === 'items' && 'Items / Products'}
              {activeTab === 'dailyEntry' && 'Daily Entry'}
              {activeTab === 'stockPrediction' && 'Stock Prediction'}
              {activeTab === 'simulator' && 'The Sandbox'}
              {activeTab === 'history' && 'Scenario Vault'}
            </h2>
            <p className="text-slate-500">
              {config.name} • {config.type} @ {config.area}
            </p>
          </div>
          
          {activeTab !== 'setup' && (
             <div className="flex items-center gap-3">
              <button 
                onClick={handleAnalyze}
                disabled={aiLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold shadow-lg shadow-slate-300 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
              >
                <BarChart3 className="w-4 h-4" /> AI Strategy
              </button>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <BusinessSetup config={config} onChange={setConfig} onContinue={() => setActiveTab('dashboard')} />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <Dashboard config={config} result={result} />
              <AIInsightsPanel insights={insights} loading={aiLoading} onRefresh={handleAnalyze} />
            </motion.div>
          )}

          {activeTab === 'simulator' && (
            <motion.div key="simulator" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DecisionSimulator initialConfig={config} onSaveScenario={saveScenario} />
            </motion.div>
          )}

          {activeTab === 'items' && (
            <motion.div key="items" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Items currency={config.currency} />
            </motion.div>
          )}

          {activeTab === 'dailyEntry' && (
            <motion.div key="dailyEntry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DailyEntry currency={config.currency} />
            </motion.div>
          )}

          {activeTab === 'stockPrediction' && (
            <motion.div key="stockPrediction" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StockPrediction currency={config.currency} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {history.length === 0 ? (
                <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">No saved scenarios yet</h3>
                  <p className="text-slate-500">Use the Decision Sandbox to create and save simulations.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {history.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{s.name}</h4>
                          <p className="text-xs text-slate-400">{new Date(s.timestamp).toLocaleString()}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                          s.result.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {s.result.riskLevel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                         <div className="p-3 bg-slate-50 rounded-xl">
                           <p className="text-[10px] text-slate-400 font-bold uppercase">Profit</p>
                           <p className="text-sm font-bold text-slate-700">{s.config.currency}{s.result.monthlyProfit.toLocaleString()}</p>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-xl">
                           <p className="text-[10px] text-slate-400 font-bold uppercase">Customers</p>
                           <p className="text-sm font-bold text-slate-700">{s.config.avgCustomers}/day</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => restoreScenario(s)}
                          className="flex-1 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Restore
                        </button>
                        <button 
                          onClick={() => deleteScenario(s.id)}
                          className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all group ${
      active 
        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className={`${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</div>
    <span className="text-sm">{label}</span>
    {active && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
  </button>
);

const MobileNavLink: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'
    }`}
  >
    {icon}
  </button>
);

export default App;
