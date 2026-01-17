
import React from 'react';
import { AISummary } from '../types';
import { Sparkles, CheckCircle2, Info, Loader2, AlertCircle, TrendingUp, XCircle } from 'lucide-react';

interface AIInsightsPanelProps {
  insights: AISummary | null;
  loading: boolean;
  onRefresh: () => void;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium">Gemini is running advanced financial simulations...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
        <Sparkles className="w-10 h-10 text-slate-300" />
        <div>
          <h3 className="text-lg font-bold text-slate-700">Get Expert Strategy</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Analyze opportunity costs, seasonality, and dependency risks.</p>
        </div>
        <button onClick={onRefresh} className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium">
          Generate Strategy Report
        </button>
      </div>
    );
  }

  const VerdictIcon = {
    'Continue': <TrendingUp className="text-emerald-500" />,
    'Improve': <AlertCircle className="text-amber-500" />,
    'Exit / Pivot': <XCircle className="text-rose-500" />
  }[insights.advisorVerdict];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Exit / Continue Advisor</h2>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
           {VerdictIcon}
           <span className="text-sm font-bold text-slate-700">Verdict: {insights.advisorVerdict}</span>
        </div>
      </div>
      
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2">
              <Info className="w-3 h-3" /> Core Insight
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm md:text-base bg-indigo-50/30 p-4 rounded-xl border border-indigo-50">
              {insights.explanation}
            </p>
          </section>

          <section>
             <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Risk & Resilience Analysis
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {insights.riskAnalysis}
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" /> Growth Steps
          </h3>
          <ul className="space-y-3">
            {insights.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span className="text-indigo-600 font-black">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
