import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell
} from 'recharts';
import { DailyEntry as DailyEntryType, MonthFolder, Item } from '../types';
import { calculateFinalPrice } from '../utils/itemUtils';
import { 
  Plus, 
  Calendar, 
  Trash2, 
  Edit2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Folder,
  BarChart3,
  X
} from 'lucide-react';

interface DailyEntryProps {
  currency: string;
}

const DailyEntry: React.FC<DailyEntryProps> = ({ currency }) => {
  const [monthFolders, setMonthFolders] = useState<MonthFolder[]>(() => {
    const saved = localStorage.getItem('foresight_daily_entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('foresight_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showAddEntryForm, setShowAddEntryForm] = useState(false);
  const [showCreateFolderForm, setShowCreateFolderForm] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyEntryType | null>(null);
  const [useManualEntry, setUseManualEntry] = useState(false);
  
  const [folderFormData, setFolderFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemId: '',
    productName: '',
    quantitySold: 1,
    sellingPrice: 0,
    expense: 0
  });

  // Sync items from localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('foresight_items');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('foresight_daily_entries', JSON.stringify(monthFolders));
  }, [monthFolders]);

  const getMonthKey = (date: string): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthDisplayName = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const handleCreateMonthFolder = () => {
    const monthKey = `${folderFormData.year}-${String(folderFormData.month).padStart(2, '0')}`;
    const existing = monthFolders.find(f => f.monthKey === monthKey);
    if (existing) {
      alert('This month folder already exists!');
      return;
    }
    
    const newFolder: MonthFolder = {
      id: Date.now().toString(),
      monthKey,
      displayName: getMonthDisplayName(monthKey),
      entries: []
    };
    setMonthFolders(prev => [...prev, newFolder].sort((a, b) => b.monthKey.localeCompare(a.monthKey)));
    setSelectedMonth(monthKey);
    setShowCreateFolderForm(false);
    setFolderFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
  };

  const calculateEntryRevenue = (entry: DailyEntryType): number => {
    return entry.quantitySold * entry.sellingPrice;
  };

  const calculateEntryProfit = (entry: DailyEntryType): number => {
    return calculateEntryRevenue(entry) - (entry.expense || 0);
  };

  const calculateMonthlyStats = (entries: DailyEntryType[]) => {
    const totalRevenue = entries.reduce((sum, entry) => sum + calculateEntryRevenue(entry), 0);
    const totalExpense = entries.reduce((sum, entry) => sum + (entry.expense || 0), 0);
    const netProfit = totalRevenue - totalExpense;
    return { totalRevenue, totalExpense, netProfit };
  };

  const updateItemStock = (itemId: string, quantityChange: number) => {
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { ...item, currentStock: Math.max(0, item.currentStock + quantityChange) }
        : item
    );
    setItems(updatedItems);
    localStorage.setItem('foresight_items', JSON.stringify(updatedItems));
  };

  const handleAddEntry = () => {
    if (!selectedMonth) {
      alert('Please select a month folder first!');
      return;
    }
    
    const hasItem = formData.itemId && !useManualEntry;
    const hasProductName = formData.productName.trim() && useManualEntry;
    
    if (!formData.date || (!hasItem && !hasProductName) || formData.sellingPrice <= 0) {
      alert('Please fill in all required fields (Date, Item/Product Name, Selling Price > 0)');
      return;
    }

    const entryMonthKey = getMonthKey(formData.date);
    if (entryMonthKey !== selectedMonth) {
      alert(`This entry's date does not belong to the selected month folder. Please select the correct month or change the date.`);
      return;
    }

    const selectedFolder = monthFolders.find(f => f.monthKey === selectedMonth);
    if (!selectedFolder) return;

    // Reduce stock if item is selected
    if (formData.itemId && !useManualEntry) {
      const selectedItem = items.find(i => i.id === formData.itemId);
      if (selectedItem) {
        if (selectedItem.currentStock < formData.quantitySold) {
          alert(`Insufficient stock! Available: ${selectedItem.currentStock} ${selectedItem.unit}`);
          return;
        }
        updateItemStock(formData.itemId, -formData.quantitySold);
      }
    }

    const selectedItem = formData.itemId ? items.find(i => i.id === formData.itemId) : null;
    const productName = useManualEntry ? formData.productName : (selectedItem?.name || formData.productName);

    const newEntry: DailyEntryType = {
      id: Date.now().toString(),
      date: formData.date,
      itemId: formData.itemId || undefined,
      productName: productName,
      quantitySold: formData.quantitySold,
      sellingPrice: formData.sellingPrice,
      expense: formData.expense || undefined
    };

    setMonthFolders(prev => prev.map(f => 
      f.monthKey === selectedMonth
        ? { ...f, entries: [...f.entries, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }
        : f
    ));

    setFormData({
      date: new Date().toISOString().split('T')[0],
      itemId: '',
      productName: '',
      quantitySold: 1,
      sellingPrice: 0,
      expense: 0
    });
    setUseManualEntry(false);
    setShowAddEntryForm(false);
  };

  const handleUpdateEntry = () => {
    const hasItem = formData.itemId && !useManualEntry;
    const hasProductName = formData.productName.trim() && useManualEntry;
    
    if (!editingEntry || !formData.date || (!hasItem && !hasProductName) || formData.sellingPrice <= 0) {
      return;
    }

    // Restore stock from old entry if it had an item
    if (editingEntry.itemId) {
      updateItemStock(editingEntry.itemId, editingEntry.quantitySold);
    }

    // Reduce stock for new entry if it has an item
    if (formData.itemId && !useManualEntry) {
      const selectedItem = items.find(i => i.id === formData.itemId);
      if (selectedItem) {
        if (selectedItem.currentStock < formData.quantitySold) {
          alert(`Insufficient stock! Available: ${selectedItem.currentStock} ${selectedItem.unit}`);
          // Restore the old stock since we're reverting
          if (editingEntry.itemId) {
            updateItemStock(editingEntry.itemId, -editingEntry.quantitySold);
          }
          return;
        }
        updateItemStock(formData.itemId, -formData.quantitySold);
      }
    }

    const oldMonthKey = getMonthKey(editingEntry.date);
    const newMonthKey = getMonthKey(formData.date);

    const selectedItem = formData.itemId ? items.find(i => i.id === formData.itemId) : null;
    const productName = useManualEntry ? formData.productName : (selectedItem?.name || formData.productName);

    const updatedEntry: DailyEntryType = {
      ...editingEntry,
      date: formData.date,
      itemId: formData.itemId || undefined,
      productName: productName,
      quantitySold: formData.quantitySold,
      sellingPrice: formData.sellingPrice,
      expense: formData.expense || undefined
    };

    setMonthFolders(prev => {
      let updated = prev.map(f => {
        if (f.monthKey === oldMonthKey) {
          return { ...f, entries: f.entries.filter(e => e.id !== editingEntry.id) };
        }
        return f;
      });

      if (oldMonthKey !== newMonthKey) {
        const newMonthFolder = updated.find(f => f.monthKey === newMonthKey);
        if (!newMonthFolder) {
          alert('The target month folder does not exist. Please create it first.');
          // Restore stock if we reduced it
          if (formData.itemId && !useManualEntry && editingEntry.itemId !== formData.itemId) {
            updateItemStock(formData.itemId, formData.quantitySold);
          }
          return prev;
        }
        updated = updated.map(f => 
          f.monthKey === newMonthKey
            ? { ...f, entries: [...f.entries, updatedEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }
            : f
        );
      } else {
        updated = updated.map(f => 
          f.monthKey === newMonthKey
            ? { ...f, entries: [...f.entries, updatedEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }
            : f
        );
      }

      return updated;
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      itemId: '',
      productName: '',
      quantitySold: 1,
      sellingPrice: 0,
      expense: 0
    });
    setUseManualEntry(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entryId: string, monthKey: string) => {
    const folder = monthFolders.find(f => f.monthKey === monthKey);
    const entry = folder?.entries.find(e => e.id === entryId);
    
    // Restore stock if entry had an item
    if (entry?.itemId) {
      updateItemStock(entry.itemId, entry.quantitySold);
    }
    
    setMonthFolders(prev => prev.map(f => 
      f.monthKey === monthKey
        ? { ...f, entries: f.entries.filter(e => e.id !== entryId) }
        : f
    ));
  };

  const handleEditEntry = (entry: DailyEntryType) => {
    setEditingEntry(entry);
    setUseManualEntry(!entry.itemId);
    
    // If entry has an itemId, get current item data (cost price might have changed)
    const item = entry.itemId ? items.find(i => i.id === entry.itemId) : null;
    const expense = entry.itemId && item ? item.costPrice : (entry.expense || 0);
    
    setFormData({
      date: entry.date,
      itemId: entry.itemId || '',
      productName: entry.productName,
      quantitySold: entry.quantitySold,
      sellingPrice: entry.sellingPrice,
      expense: expense
    });
    setShowAddEntryForm(true);
  };

  const selectedFolder = selectedMonth ? monthFolders.find(f => f.monthKey === selectedMonth) : null;
  const monthlyStats = selectedFolder ? calculateMonthlyStats(selectedFolder.entries) : null;

  // Prepare chart data
  const dailyData = selectedFolder?.entries.reduce((acc, entry) => {
    const date = entry.date;
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.revenue += calculateEntryRevenue(entry);
      existing.expense += entry.expense || 0;
      existing.profit += calculateEntryProfit(entry);
    } else {
      acc.push({
        date,
        revenue: calculateEntryRevenue(entry),
        expense: entry.expense || 0,
        profit: calculateEntryProfit(entry)
      });
    }
    return acc;
  }, [] as Array<{ date: string; revenue: number; expense: number; profit: number }>) || [];

  // Sort daily data by date
  dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format dates for display
  const formattedDailyData = dailyData.map(d => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  // Profit distribution data (positive vs negative profit days)
  const profitDistribution = selectedFolder?.entries.reduce((acc, entry) => {
    const profit = calculateEntryProfit(entry);
    if (profit > 0) {
      acc.positive += profit;
    } else if (profit < 0) {
      acc.negative += Math.abs(profit);
    }
    return acc;
  }, { positive: 0, negative: 0 }) || { positive: 0, negative: 0 };

  const pieData = [
    { name: 'Profitable', value: profitDistribution.positive, color: '#10b981' },
    { name: 'Losses', value: profitDistribution.negative, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Monthly Folders Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Monthly Folders</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateFolderForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Folder className="w-4 h-4" />
              Create Month Folder
            </button>
            {selectedMonth && (
              <button
                onClick={() => {
                  setShowAddEntryForm(true);
                  setEditingEntry(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            )}
          </div>
        </div>
        
        {monthFolders.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-700 mb-2">No monthly folders yet</h4>
            <p className="text-slate-500 text-sm mb-4">Click "Create Month Folder" to get started</p>
            <button
              onClick={() => setShowCreateFolderForm(true)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Folder className="w-4 h-4" />
              Create Your First Month Folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthFolders.map(folder => {
              const stats = calculateMonthlyStats(folder.entries);
              return (
                <motion.div
                  key={folder.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMonth(folder.monthKey)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedMonth === folder.monthKey
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-slate-900">{folder.displayName}</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Entries:</span>
                      <span className="font-semibold">{folder.entries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Revenue:</span>
                      <span className="font-semibold text-emerald-600">{currency}{stats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Profit:</span>
                      <span className={`font-semibold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {currency}{stats.netProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Month Folder Form */}
      <AnimatePresence>
        {showCreateFolderForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Create Month Folder</h3>
              <button
                onClick={() => {
                  setShowCreateFolderForm(false);
                  setFolderFormData({
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                  });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Month *</label>
                <select
                  value={folderFormData.month}
                  onChange={(e) => setFolderFormData({ ...folderFormData, month: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return (
                      <option key={month} value={month}>
                        {monthNames[month - 1]}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Year *</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={folderFormData.year}
                  onChange={(e) => setFolderFormData({ ...folderFormData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateFolderForm(false);
                  setFolderFormData({
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                  });
                }}
                className="px-6 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMonthFolder}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Create Folder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Entry Form */}
      <AnimatePresence>
        {showAddEntryForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingEntry ? 'Edit Entry' : 'Add New Entry'}
                </h3>
                {!selectedMonth && !editingEntry && (
                  <p className="text-sm text-rose-600 mt-1">Please select a month folder first!</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddEntryForm(false);
                  setEditingEntry(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    productName: '',
                    quantitySold: 1,
                    sellingPrice: 0,
                    expense: 0
                  });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <label className="block text-sm font-semibold text-slate-700">Select Item or Enter Manually *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseManualEntry(!useManualEntry);
                      if (!useManualEntry) {
                        setFormData({ ...formData, itemId: '', productName: '', sellingPrice: 0 });
                      } else {
                        setFormData({ ...formData, itemId: '', sellingPrice: 0 });
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {useManualEntry ? '← Select from Items' : 'Enter Manually →'}
                  </button>
                </div>
                {!useManualEntry ? (
                  <select
                    value={formData.itemId}
                    onChange={(e) => {
                      const itemId = e.target.value;
                      const selectedItem = items.find(i => i.id === itemId);
                      const finalPrice = selectedItem ? calculateFinalPrice(selectedItem) : 0;
                      setFormData({
                        ...formData,
                        itemId: itemId,
                        productName: selectedItem?.name || '',
                        sellingPrice: finalPrice,
                        expense: selectedItem?.costPrice || 0
                      });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required={!useManualEntry}
                  >
                    <option value="">Select an item...</option>
                    {items.map(item => {
                      const finalPrice = calculateFinalPrice(item);
                      return (
                        <option key={item.id} value={item.id}>
                          {item.name} ({currency}{finalPrice.toLocaleString()}{item.offer?.enabled ? ' 🔖' : ''}) - Stock: {item.currentStock} {item.unit}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter product name manually"
                    required={useManualEntry}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity Sold *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantitySold}
                  onChange={(e) => setFormData({ ...formData, quantitySold: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Selling Price ({currency}) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Expense ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.expense}
                  onChange={(e) => setFormData({ ...formData, expense: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddEntryForm(false);
                  setEditingEntry(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    itemId: '',
                    productName: '',
                    quantitySold: 1,
                    sellingPrice: 0,
                    expense: 0
                  });
                  setUseManualEntry(false);
                }}
                className="px-6 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingEntry ? handleUpdateEntry : handleAddEntry}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {editingEntry ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Month Details */}
      {selectedFolder && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Monthly Summary */}
          {monthlyStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-slate-600 uppercase">Total Revenue</h4>
                </div>
                <p className="text-2xl font-bold text-slate-900">{currency}{monthlyStats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingDown className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-semibold text-slate-600 uppercase">Total Expense</h4>
                </div>
                <p className="text-2xl font-bold text-slate-900">{currency}{monthlyStats.totalExpense.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className={`w-5 h-5 ${monthlyStats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                  <h4 className="text-sm font-semibold text-slate-600 uppercase">Net Profit</h4>
                </div>
                <p className={`text-2xl font-bold ${monthlyStats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {currency}{monthlyStats.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Charts Toggle Button */}
          {formattedDailyData.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <BarChart3 className="w-5 h-5" />
                {showCharts ? 'Hide Charts' : 'Show Revenue vs Expense vs Profit Charts'}
              </button>
            </div>
          )}

          {/* Charts */}
          {showCharts && formattedDailyData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expense vs Profit Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Revenue vs Expense vs Profit</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="dateLabel" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => `${currency}${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Sales Trend */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Daily Sales Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="dateLabel" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => `${currency}${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Profit Distribution Pie Chart */}
              {pieData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Profit Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => `${currency}${value.toLocaleString()}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Daily Entries Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-slate-800">Daily Entries - {selectedFolder.displayName}</h4>
                <span className="text-sm text-slate-600">{selectedFolder.entries.length} entries</span>
              </div>
            </div>
            {selectedFolder.entries.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No entries for this month yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Selling Price</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Expense</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedFolder.entries.map(entry => {
                      const revenue = calculateEntryRevenue(entry);
                      const profit = calculateEntryProfit(entry);
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{entry.productName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right">{entry.quantitySold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right">{currency}{entry.sellingPrice.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right">
                            {entry.expense ? `${currency}${entry.expense.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 text-right">
                            {currency}{revenue.toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {currency}{profit.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditEntry(entry)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this entry?')) {
                                    handleDeleteEntry(entry.id, selectedFolder.monthKey);
                                  }
                                }}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DailyEntry;
