import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  LineChart,
  Bar,
  BarChart,
  ReferenceLine
} from 'recharts';
import { Item, DailyEntry, MonthFolder } from '../types';
import {
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  Target
} from 'lucide-react';

interface StockPredictionProps {
  currency: string;
}

interface SalesData {
  date: string;
  quantity: number;
}

const StockPrediction: React.FC<StockPredictionProps> = ({ currency }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [salesHistory, setSalesHistory] = useState<SalesData[]>([]);

  useEffect(() => {
    // Load items
    const savedItems = localStorage.getItem('foresight_items');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }

    // Sync items periodically
    const interval = setInterval(() => {
      const saved = localStorage.getItem('foresight_items');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedItemId) {
      setSalesHistory([]);
      return;
    }

    // Load sales history from DailyEntry
    const savedFolders = localStorage.getItem('foresight_daily_entries');
    if (!savedFolders) return;

    const folders: MonthFolder[] = JSON.parse(savedFolders);
    const allEntries: DailyEntry[] = [];
    
    folders.forEach(folder => {
      allEntries.push(...folder.entries);
    });

    // Filter entries for selected item and sort by date
    const itemEntries = allEntries
      .filter(entry => entry.itemId === selectedItemId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by date
    const salesMap = new Map<string, number>();
    itemEntries.forEach(entry => {
      const date = entry.date;
      salesMap.set(date, (salesMap.get(date) || 0) + entry.quantitySold);
    });

    const sales: SalesData[] = Array.from(salesMap.entries())
      .map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setSalesHistory(sales);
  }, [selectedItemId]);

  const selectedItem = items.find(i => i.id === selectedItemId);

  // Calculate average daily sales
  const calculateAverageDailySales = (): number => {
    if (salesHistory.length === 0) return 0;
    const totalSales = salesHistory.reduce((sum, s) => sum + s.quantity, 0);
    const days = salesHistory.length;
    return totalSales / days;
  };

  const averageDailySales = calculateAverageDailySales();

  // Calculate estimated days stock will last
  const calculateDaysRemaining = (): number | null => {
    if (!selectedItem || averageDailySales === 0) return null;
    return Math.floor(selectedItem.currentStock / averageDailySales);
  };

  const daysRemaining = calculateDaysRemaining();

  // Predict demand based on sales history
  const predictDemand = (days: number): number => {
    if (averageDailySales === 0) return 0;
    return Math.ceil(averageDailySales * days);
  };

  const shortTermDemand = predictDemand(7);
  const monthlyDemand = predictDemand(30);

  // Reorder recommendation
  const calculateReorderRecommendation = () => {
    if (!selectedItem || averageDailySales === 0) return null;

    const daysUntilReorder = daysRemaining ? Math.max(0, daysRemaining - 7) : 0; // Reorder 7 days before stockout
    const reorderQuantity = Math.ceil(monthlyDemand * 1.2); // 20% buffer
    const reorderDate = new Date();
    reorderDate.setDate(reorderDate.getDate() + daysUntilReorder);

    return {
      daysUntilReorder,
      reorderDate,
      reorderQuantity,
      reason: daysUntilReorder <= 7 ? 'Low stock - reorder soon!' : 'Plan ahead for optimal stock levels'
    };
  };

  const reorderRecommendation = calculateReorderRecommendation();

  // Risk assessment
  const assessRisk = () => {
    if (!selectedItem) return null;

    const risks: string[] = [];
    const alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string }> = [];

    // Low stock warning
    if (selectedItem.currentStock === 0) {
      risks.push('out_of_stock');
      alerts.push({
        type: 'danger',
        message: '⚠️ OUT OF STOCK - Immediate reorder required!'
      });
    } else if (daysRemaining !== null && daysRemaining <= 7) {
      risks.push('low_stock');
      alerts.push({
        type: 'danger',
        message: `⚠️ LOW STOCK - Only ${daysRemaining} days remaining. Reorder immediately!`
      });
    } else if (daysRemaining !== null && daysRemaining <= 14) {
      risks.push('stock_warning');
      alerts.push({
        type: 'warning',
        message: `⚠️ Stock warning - ${daysRemaining} days remaining. Plan reorder.`
      });
    }

    // Excess stock alert
    const stockRatio = selectedItem.openingStock > 0 ? selectedItem.currentStock / selectedItem.openingStock : 0;
    if (stockRatio > 0.8 && salesHistory.length > 7) {
      // If more than 80% stock remaining and we have sales history
      const daysSinceFirstSale = salesHistory.length > 0 
        ? Math.floor((new Date().getTime() - new Date(salesHistory[0].date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      if (daysSinceFirstSale > 30) {
        risks.push('excess_stock');
        alerts.push({
          type: 'info',
          message: `ℹ️ Excess stock detected - ${selectedItem.currentStock} units remaining. Consider reducing purchase quantity.`
        });
      }
    }

    // Slow-moving stock
    if (salesHistory.length > 14 && averageDailySales < selectedItem.currentStock / 60) {
      // Less than 2 months of stock at current sales rate
      risks.push('slow_moving');
      alerts.push({
        type: 'warning',
        message: '⚠️ Slow-moving stock - Low sales velocity. Consider promotional pricing or reducing reorder quantity.'
      });
    }

    return { risks, alerts };
  };

  const riskAssessment = assessRisk();

  // Stock impact on profit
  const calculateStockImpact = () => {
    if (!selectedItem || averageDailySales === 0) return null;

    const finalPrice = calculateFinalPrice(selectedItem);
    const profitPerUnit = finalPrice - selectedItem.costPrice;
    const dailyProfit = averageDailySales * profitPerUnit;
    
    // Missed sales if stockout
    const potentialMissedSales = selectedItem.currentStock === 0 
      ? averageDailySales * profitPerUnit * (daysRemaining || 7)
      : 0;

    // Cash blocked in inventory
    const cashBlocked = selectedItem.currentStock * selectedItem.costPrice;

    // Potential profit from current stock
    const potentialProfitFromStock = selectedItem.currentStock * profitPerUnit;

    return {
      dailyProfit,
      potentialMissedSales,
      cashBlocked,
      potentialProfitFromStock,
      profitMargin: selectedItem.costPrice > 0 
        ? ((selectedItem.sellingPrice - selectedItem.costPrice) / selectedItem.costPrice) * 100
        : 0
    };
  };

  const stockImpact = calculateStockImpact();

  // Prepare chart data for Stock Level Over Time
  const stockLevelData = salesHistory.map((sale, index) => {
    let remainingStock = selectedItem?.currentStock || 0;
    // Calculate stock level going backwards from current
    for (let i = salesHistory.length - 1; i >= index; i--) {
      remainingStock += salesHistory[i].quantity;
    }
    return {
      date: new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      stock: remainingStock,
      sales: sale.quantity
    };
  }).reverse();

  // Add current date to chart
  if (selectedItem && stockLevelData.length > 0) {
    stockLevelData.push({
      date: 'Today',
      stock: selectedItem.currentStock,
      sales: 0
    });
  }

  // Prepare chart data for Stock vs Predicted Demand
  const demandComparisonData = [
    {
      period: 'Current\nStock',
      stock: selectedItem?.currentStock || 0,
      '7-Day Demand': shortTermDemand,
      '30-Day Demand': monthlyDemand
    }
  ];

  return (
    <div className="space-y-6">
      {/* Item Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800">Item Selection</h3>
        </div>
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Select an item to analyze...</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} - Stock: {item.currentStock} {item.unit}
            </option>
          ))}
        </select>
        {items.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            No items found. Please add items in the "Items / Products" section first.
          </p>
        )}
      </div>

      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Current Stock Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-semibold text-slate-600 uppercase">Available Stock</h4>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {selectedItem.currentStock}
                <span className="text-lg text-slate-500 ml-2">{selectedItem.unit}</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-semibold text-slate-600 uppercase">Avg Daily Sales</h4>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {averageDailySales.toFixed(1)}
                <span className="text-lg text-slate-500 ml-2">{selectedItem.unit}/day</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-semibold text-slate-600 uppercase">Days Remaining</h4>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {daysRemaining !== null ? daysRemaining : '∞'}
                <span className="text-lg text-slate-500 ml-2">days</span>
              </p>
            </div>
          </div>

          {/* Risk & Alert System */}
          {riskAssessment && riskAssessment.alerts.length > 0 && (
            <div className="space-y-3">
              {riskAssessment.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    alert.type === 'danger'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : alert.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sales-Based Demand Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-indigo-600" />
                <h4 className="text-lg font-bold text-slate-800">Short-Term Demand (7 Days)</h4>
              </div>
              <p className="text-4xl font-bold text-indigo-600 mb-2">
                {shortTermDemand}
                <span className="text-lg text-slate-500 ml-2">{selectedItem.unit}</span>
              </p>
              <p className="text-sm text-slate-500">Based on average daily sales of {averageDailySales.toFixed(1)} {selectedItem.unit}/day</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-emerald-600" />
                <h4 className="text-lg font-bold text-slate-800">Monthly Demand (30 Days)</h4>
              </div>
              <p className="text-4xl font-bold text-emerald-600 mb-2">
                {monthlyDemand}
                <span className="text-lg text-slate-500 ml-2">{selectedItem.unit}</span>
              </p>
              <p className="text-sm text-slate-500">Based on average daily sales of {averageDailySales.toFixed(1)} {selectedItem.unit}/day</p>
            </div>
          </div>

          {/* Reorder Recommendation */}
          {reorderRecommendation && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h4 className="text-lg font-bold text-slate-800">Reorder Recommendation</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600 uppercase mb-2">When to Reorder</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {reorderRecommendation.daysUntilReorder <= 7 ? 'Now' : `In ${reorderRecommendation.daysUntilReorder} days`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {reorderRecommendation.reorderDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 uppercase mb-2">Quantity to Reorder</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {reorderRecommendation.reorderQuantity}
                    <span className="text-lg text-slate-500 ml-2">{selectedItem.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 uppercase mb-2">Reason</p>
                  <p className="text-sm text-slate-700">{reorderRecommendation.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stock Impact on Profit */}
          {stockImpact && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h4 className="text-lg font-bold text-slate-800">Stock Impact on Profit</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Daily Profit</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {currency}{stockImpact.dailyProfit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Cash Blocked</p>
                  <p className="text-xl font-bold text-amber-600">
                    {currency}{stockImpact.cashBlocked.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Potential Profit</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {currency}{stockImpact.potentialProfitFromStock.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Profit Margin</p>
                  <p className="text-xl font-bold text-slate-900">
                    {stockImpact.profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
              {stockImpact.potentialMissedSales > 0 && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                  <p className="text-sm font-semibold text-rose-800">
                    ⚠️ Potential Missed Sales: {currency}{stockImpact.potentialMissedSales.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graph 1: Stock vs Predicted Demand */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Stock vs Predicted Demand</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${value} ${selectedItem.unit}`, '']}
                    />
                    <Legend />
                    <Bar dataKey="stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="7-Day Demand" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="30-Day Demand" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <ReferenceLine y={selectedItem.currentStock} stroke="#6366f1" strokeDasharray="5 5" label={{ value: 'Current Stock', position: 'top' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 2: Stock Level Over Time */}
            {stockLevelData.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Stock Level Over Time</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockLevelData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`${value} ${selectedItem.unit}`, '']}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="stock" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} name="Stock Level" />
                      <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Out of Stock', position: 'insideBottomRight' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Slow-Moving Stock Insight */}
          {riskAssessment?.risks.includes('slow_moving') && (
            <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                <h4 className="text-lg font-bold text-amber-800">Slow-Moving Stock Insight</h4>
              </div>
              <p className="text-sm text-amber-700 mb-4">
                This item shows low sales velocity compared to current stock levels. Average daily sales: {averageDailySales.toFixed(1)} {selectedItem.unit}/day
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Recommendation</p>
                  <p className="text-sm text-amber-700">Reduce purchase quantity or offer promotional pricing</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Action</p>
                  <p className="text-sm text-amber-700">Consider running a discount to clear excess inventory</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Next Order</p>
                  <p className="text-sm text-amber-700">Order {Math.ceil(monthlyDemand * 0.5)} {selectedItem.unit} instead of full demand</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default StockPrediction;
