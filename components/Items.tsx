import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item } from '../types';
import { calculateFinalPrice } from '../utils/itemUtils';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Tag
} from 'lucide-react';

interface ItemsProps {
  currency: string;
}

const Items: React.FC<ItemsProps> = ({ currency }) => {
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('foresight_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerItem, setOfferItem] = useState<Item | null>(null);
  const [offerFormData, setOfferFormData] = useState({
    enabled: false,
    type: 'percentage' as 'percentage' | 'flat',
    value: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    openingStock: 0,
    unit: 'pcs'
  });

  useEffect(() => {
    localStorage.setItem('foresight_items', JSON.stringify(items));
  }, [items]);

  const calculateProfitPerUnit = (item: Item): number => {
    const finalPrice = calculateFinalPrice(item);
    return finalPrice - item.costPrice;
  };

  const getStockStatus = (item: Item): { label: string; color: string; icon: React.ReactNode } => {
    if (item.currentStock === 0) {
      return {
        label: 'Out of Stock',
        color: 'bg-rose-100 text-rose-700 border-rose-200',
        icon: <AlertTriangle className="w-4 h-4" />
      };
    }
    const stockPercentage = (item.currentStock / item.openingStock) * 100;
    if (stockPercentage <= 20) {
      return {
        label: 'Low Stock',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: <AlertTriangle className="w-4 h-4" />
      };
    }
    return {
      label: 'In Stock',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: <CheckCircle className="w-4 h-4" />
    };
  };

  const handleAddItem = () => {
    if (!formData.name || formData.sellingPrice <= 0 || formData.costPrice < 0) {
      alert('Please fill in all required fields (Name, Selling Price > 0, Cost Price >= 0)');
      return;
    }

    const newItem: Item = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category || undefined,
      costPrice: formData.costPrice,
      sellingPrice: formData.sellingPrice,
      openingStock: formData.openingStock,
      currentStock: formData.openingStock,
      unit: formData.unit
    };

    setItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    resetForm();
  };

  const handleUpdateItem = () => {
    if (!editingItem || !formData.name || formData.sellingPrice <= 0 || formData.costPrice < 0) {
      return;
    }

    const updatedItem: Item = {
      ...editingItem,
      name: formData.name,
      category: formData.category || undefined,
      costPrice: formData.costPrice,
      sellingPrice: formData.sellingPrice,
      openingStock: formData.openingStock,
      unit: formData.unit
      // Note: currentStock is not updated here - it's managed by sales
    };

    setItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
    resetForm();
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || '',
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      openingStock: item.openingStock,
      unit: item.unit
    });
    setShowAddForm(true);
  };

  const handleOpenOfferModal = (item: Item) => {
    setOfferItem(item);
    setOfferFormData({
      enabled: item.offer?.enabled || false,
      type: item.offer?.type || 'percentage',
      value: item.offer?.value || 0
    });
    setShowOfferModal(true);
  };

  const handleSaveOffer = () => {
    if (!offerItem) return;

    const updatedItem: Item = {
      ...offerItem,
      offer: offerFormData.enabled ? {
        enabled: offerFormData.enabled,
        type: offerFormData.type,
        value: offerFormData.value
      } : undefined
    };

    setItems(prev => prev.map(item => item.id === offerItem.id ? updatedItem : item));
    setShowOfferModal(false);
    setOfferItem(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      costPrice: 0,
      sellingPrice: 0,
      openingStock: 0,
      unit: 'pcs'
    });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const updateStock = (itemId: string, quantityChange: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, currentStock: Math.max(0, item.currentStock + quantityChange) }
        : item
    ));
  };

  // Expose updateStock function via window for DailyEntry to use
  useEffect(() => {
    (window as any).updateItemStock = updateStock;
    return () => {
      delete (window as any).updateItemStock;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Items / Products</h3>
          <p className="text-sm text-slate-500">Manage your product catalog and inventory</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Optional category"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cost Price ({currency}) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Opening Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.openingStock}
                  onChange={(e) => setFormData({ ...formData, openingStock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Unit *</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="pcs">pcs (pieces)</option>
                  <option value="kg">kg (kilogram)</option>
                  <option value="g">g (gram)</option>
                  <option value="litre">litre</option>
                  <option value="ml">ml (milliliter)</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                  <option value="dozen">dozen</option>
                  <option value="other">other</option>
                </select>
                {formData.unit === 'other' && (
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter custom unit"
                  />
                )}
              </div>
            </div>
            {formData.sellingPrice > 0 && formData.costPrice >= 0 && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">Profit per unit:</span>
                  <span className="font-bold text-emerald-600">
                    {currency}{(formData.sellingPrice - formData.costPrice).toLocaleString()}
                  </span>
                  <span className="text-slate-500">
                    ({(formData.costPrice > 0 ? ((formData.sellingPrice - formData.costPrice) / formData.costPrice * 100).toFixed(1) : '∞')}% margin)
                  </span>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-slate-700 mb-2">No items yet</h4>
          <p className="text-slate-500 text-sm mb-4">Start by adding your first product/item</p>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-slate-800">Items List ({items.length})</h4>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Cost Price</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Selling Price</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Profit/Unit</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Available Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map(item => {
                  const profitPerUnit = calculateProfitPerUnit(item);
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {item.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right">
                        {currency}{item.costPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 text-right">
                        <div className="flex flex-col items-end">
                          {item.offer?.enabled ? (
                            <>
                              <span className="text-slate-400 line-through text-xs">{currency}{item.sellingPrice.toLocaleString()}</span>
                              <span className="text-emerald-600">{currency}{calculateFinalPrice(item).toLocaleString()}</span>
                            </>
                          ) : (
                            <span>{currency}{item.sellingPrice.toLocaleString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 text-right">
                        {currency}{profitPerUnit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right">
                        <span className="font-medium">{item.currentStock}</span>
                        <span className="text-slate-500 ml-1">/ {item.openingStock} {item.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenOfferModal(item)}
                            className={`p-2 rounded-lg transition-colors ${
                              item.offer?.enabled 
                                ? 'text-emerald-600 hover:bg-emerald-50 bg-emerald-50' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            title="Offer"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
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
        </div>
      )}

      {/* Offer Modal */}
      <AnimatePresence>
        {showOfferModal && offerItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowOfferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Offer Settings</h3>
                  <p className="text-sm text-slate-500 mt-1">{offerItem.name}</p>
                </div>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Enable Offer Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Enable Offer</label>
                    <p className="text-xs text-slate-500 mt-1">Turn offer on or off for this item</p>
                  </div>
                  <button
                    onClick={() => setOfferFormData({ ...offerFormData, enabled: !offerFormData.enabled })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      offerFormData.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        offerFormData.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {offerFormData.enabled && (
                  <>
                    {/* Offer Type */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Offer Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setOfferFormData({ ...offerFormData, type: 'percentage' })}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                            offerFormData.type === 'percentage'
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          Percentage (%)
                        </button>
                        <button
                          onClick={() => setOfferFormData({ ...offerFormData, type: 'flat' })}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                            offerFormData.type === 'flat'
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          Flat Amount ({currency})
                        </button>
                      </div>
                    </div>

                    {/* Offer Value */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Offer Value
                        {offerFormData.type === 'percentage' ? ' (%)' : ` (${currency})`}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={offerFormData.type === 'percentage' ? 100 : offerItem.sellingPrice}
                        step={offerFormData.type === 'percentage' ? 1 : 0.01}
                        value={offerFormData.value}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const maxValue = offerFormData.type === 'percentage' ? 100 : offerItem.sellingPrice;
                          setOfferFormData({ ...offerFormData, value: Math.min(value, maxValue) });
                        }}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder={offerFormData.type === 'percentage' ? 'e.g., 10' : 'e.g., 100'}
                      />
                    </div>

                    {/* Final Price Preview */}
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                      <p className="text-xs font-semibold text-emerald-800 uppercase mb-2">Final Price Preview</p>
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <span className="text-slate-500 line-through">
                          Original: {currency}{offerItem.sellingPrice.toLocaleString()}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="text-emerald-600">
                          Now: {currency}{(() => {
                            if (offerFormData.type === 'percentage') {
                              const discount = (offerItem.sellingPrice * offerFormData.value) / 100;
                              return Math.max(0, offerItem.sellingPrice - discount).toLocaleString();
                            } else {
                              return Math.max(0, offerItem.sellingPrice - offerFormData.value).toLocaleString();
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="px-6 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOffer}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Save Offer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Items;
