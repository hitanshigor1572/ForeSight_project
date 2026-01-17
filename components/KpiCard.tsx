
import React from 'react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, trend, color = 'blue' }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    red: 'bg-rose-50 border-rose-100 text-rose-700',
    yellow: 'bg-amber-50 border-amber-100 text-amber-700',
    slate: 'bg-slate-50 border-slate-100 text-slate-700',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border ${colorMap[color]} shadow-sm transition-all hover:shadow-md flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</span>
        {icon && <div className="p-2 bg-white bg-opacity-50 rounded-lg">{icon}</div>}
      </div>
      <div>
        <h3 className="text-2xl font-bold">{value}</h3>
        {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
      </div>
    </motion.div>
  );
};

export default KpiCard;
