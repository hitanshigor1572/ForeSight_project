
import React, { useState, useEffect } from 'react';
import { BusinessConfig, SeasonType } from '../types';
import { BUSINESS_TYPES, AREA_TYPES, CURRENCIES } from '../constants';
import { Calendar, TrendingUp, TrendingDown, Minus, Plus, Check, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BusinessSetupProps {
  config: BusinessConfig;
  onChange: (config: BusinessConfig) => void;
  onContinue: () => void;
}

const BusinessSetup: React.FC<BusinessSetupProps> = ({ config, onChange, onContinue }) => {
  const [customType, setCustomType] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [showCustomAreaInput, setShowCustomAreaInput] = useState(false);

  // Initialize custom flags if config values are not in defaults
  useEffect(() => {
    const isStandardType = BUSINESS_TYPES.some(t => t.value === config.type);
    const isStandardArea = AREA_TYPES.includes(config.area);
    
    if (!isStandardType && config.type) {
      setShowCustomTypeInput(true);
      setCustomType(config.type);
    }
    if (!isStandardArea && config.area) {
      setShowCustomAreaInput(true);
      setCustomArea(config.area);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['rent', 'avgCustomers', 'avgBill', 'initialCash', 'salaries', 'marketingSpend', 'variableCostPercent', 'opportunityCostJob', 'opportunityCostFD'];
    onChange({
      ...config,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
    });
  };

  const handleTypeSelect = (type: string) => {
    if (type === 'CUSTOM') {
      setShowCustomTypeInput(true);
      onChange({ ...config, type: customType || 'New Business' });
    } else {
      setShowCustomTypeInput(false);
      onChange({ ...config, type });
    }
  };

  const handleAreaSelect = (area: string) => {
    if (area === 'CUSTOM') {
      setShowCustomAreaInput(true);
      onChange({ ...config, area: customArea || 'New Context' });
    } else {
      setShowCustomAreaInput(false);
      onChange({ ...config, area });
    }
  };

  const handleCurrencySelect = (code: string) => {
    onChange({ ...config, currency: code });
  };

  const toggleSeason = (monthIndex: number) => {
    const types: SeasonType[] = ['Normal', 'High', 'Low'];
    const currentType = config.seasons[monthIndex].type;
    const nextType = types[(types.indexOf(currentType) + 1) % types.length];
    
    const newSeasons = [...config.seasons];
    newSeasons[monthIndex] = { ...newSeasons[monthIndex], type: nextType };
    onChange({ ...config, seasons: newSeasons });
  };

  const getSeasonIcon = (type: SeasonType) => {
    switch (type) {
      case 'High': return <TrendingUp className="w-3 h-3 text-emerald-500" />;
      case 'Low': return <TrendingDown className="w-3 h-3 text-rose-500" />;
      default: return <Minus className="w-3 h-3 text-slate-400" />;
    }
  };

  const getSeasonColor = (type: SeasonType) => {
    switch (type) {
      case 'High': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'Low': return 'border-rose-200 bg-rose-50 text-rose-700';
      default: return 'border-slate-200 bg-white text-slate-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Venture Configuration</h1>
        <p className="text-lg text-slate-600">Visible, interactive setup for precise business modeling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Visual Business Type Selection */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Select Business Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BUSINESS_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleTypeSelect(t.value)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                    config.type === t.value && !showCustomTypeInput
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${config.type === t.value && !showCustomTypeInput ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border'}`}>
                    {t.icon}
                  </div>
                  <span className={`text-sm font-semibold ${config.type === t.value && !showCustomTypeInput ? 'text-indigo-900' : 'text-slate-700'}`}>{t.label}</span>
                  {config.type === t.value && !showCustomTypeInput && <Check className="w-4 h-4 ml-auto text-indigo-600" />}
                </button>
              ))}
              <button
                onClick={() => handleTypeSelect('CUSTOM')}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  showCustomTypeInput
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${showCustomTypeInput ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border'}`}>
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold">Other / Custom</span>
                {showCustomTypeInput && <Check className="w-4 h-4 ml-auto text-indigo-600" />}
              </button>
            </div>

            <AnimatePresence>
              {showCustomTypeInput && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-6">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Specify Custom Business Type</label>
                  <input
                    value={customType}
                    onChange={(e) => {
                      setCustomType(e.target.value);
                      onChange({ ...config, type: e.target.value });
                    }}
                    placeholder="e.g. Pet Grooming, VR Arena, Cloud Kitchen"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 outline-none bg-indigo-50/20 text-indigo-900 font-medium transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Area Selection Grid */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Select Area Context</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {AREA_TYPES.map((a) => (
                <button
                  key={a}
                  onClick={() => handleAreaSelect(a)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center ${
                    config.area === a && !showCustomAreaInput
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {a}
                </button>
              ))}
              <button
                onClick={() => handleAreaSelect('CUSTOM')}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center ${
                  showCustomAreaInput
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                Custom Area
              </button>
            </div>

            <AnimatePresence>
              {showCustomAreaInput && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-6">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Describe Custom Area</label>
                  <input
                    value={customArea}
                    onChange={(e) => {
                      setCustomArea(e.target.value);
                      onChange({ ...config, area: e.target.value });
                    }}
                    placeholder="e.g. Industrial Hub, Tourist Beachfront, Rural Highway"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 outline-none bg-indigo-50/20 text-indigo-900 font-medium transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Currency Selection Grid (Replaces standard dropdown for visibility) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Select Base Currency</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleCurrencySelect(c.code)}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                    config.currency === c.code
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className={`text-xl font-bold ${config.currency === c.code ? 'text-indigo-600' : 'text-slate-400'}`}>{c.code}</span>
                  <span className={`text-sm font-semibold ${config.currency === c.code ? 'text-indigo-900' : 'text-slate-700'}`}>{c.name}</span>
                  {config.currency === c.code && <Check className="w-4 h-4 ml-auto text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">General Identity</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Venture Name</label>
                  <input 
                    name="name" value={config.name} onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="e.g. Urban Bean Cafe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Initial Cash Buffer ({config.currency})</label>
                  <input name="initialCash" type="number" value={config.initialCash} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none" />
                  <p className="text-[10px] text-slate-400 mt-2">Available funds before launching.</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Monthly Core Overheads</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Rent</label>
                    <input name="rent" type="number" value={config.rent} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Salaries</label>
                    <input name="salaries" type="number" value={config.salaries} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Daily Footfall</label>
                    <input name="avgCustomers" type="number" value={config.avgCustomers} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Avg. Bill Value</label>
                    <input name="avgBill" type="number" value={config.avgBill} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Seasonality Logic</h3>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {config.seasons.map((s, idx) => (
                  <button
                    key={s.month}
                    onClick={() => toggleSeason(idx)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${getSeasonColor(s.type)}`}
                  >
                    <span className="text-[10px] font-bold uppercase mb-1">{s.month}</span>
                    {getSeasonIcon(s.type)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Opportunity Advisor</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Alternative Salary</label>
              <input name="opportunityCostJob" type="number" value={config.opportunityCostJob} onChange={handleChange} className="w-full bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none" />
              <p className="text-[10px] text-slate-500 mt-2">Monthly income if you took a job instead.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">FD Interest Rate %</label>
              <input name="opportunityCostFD" type="number" value={config.opportunityCostFD} onChange={handleChange} className="w-full bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none" />
            </div>
            
            <div className="pt-6 mt-6 border-t border-slate-800">
              <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
                <p className="text-xs text-indigo-100 leading-relaxed italic">
                  "This section compares your business profit against low-risk alternatives like jobs and fixed deposits."
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onContinue}
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-3xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
          >
            Launch Simulation <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessSetup;
