
import React from 'react';
import { BusinessType, AreaType, BusinessConfig, SeasonConfig } from './types';
import { Coffee, ShoppingBag, Cloud, Users, Globe, Factory } from 'lucide-react';

export const BUSINESS_TYPES: { value: BusinessType; label: string; icon: React.ReactNode }[] = [
  { value: 'Cafe', label: 'Cafe / Bakery', icon: <Coffee className="w-4 h-4" /> },
  { value: 'Retail', label: 'Retail Store', icon: <ShoppingBag className="w-4 h-4" /> },
  { value: 'SaaS', label: 'Software (SaaS)', icon: <Cloud className="w-4 h-4" /> },
  { value: 'Consulting', label: 'Consulting', icon: <Users className="w-4 h-4" /> },
  { value: 'E-commerce', label: 'E-commerce', icon: <Globe className="w-4 h-4" /> },
  { value: 'Manufacturing', label: 'Manufacturing', icon: <Factory className="w-4 h-4" /> },
];

export const AREA_TYPES: AreaType[] = ['Residential', 'Student', 'Office', 'Mixed'];

export const CURRENCIES = [
  { code: '₹', name: 'INR' },
  { code: '$', name: 'USD' },
  { code: '€', name: 'EUR' },
  { code: '£', name: 'GBP' },
];

const DEFAULT_SEASONS: SeasonConfig[] = [
  { month: 'Jan', type: 'Normal' }, { month: 'Feb', type: 'Normal' },
  { month: 'Mar', type: 'High' }, { month: 'Apr', type: 'High' },
  { month: 'May', type: 'Normal' }, { month: 'Jun', type: 'Low' },
  { month: 'Jul', type: 'Low' }, { month: 'Aug', type: 'Normal' },
  { month: 'Sep', type: 'Normal' }, { month: 'Oct', type: 'High' },
  { month: 'Nov', type: 'High' }, { month: 'Dec', type: 'High' },
];

export const DEFAULT_CONFIG: BusinessConfig = {
  id: 'default',
  name: 'My New Venture',
  type: 'Cafe',
  area: 'Mixed',
  rent: 25000,
  avgCustomers: 25,
  initialCash: 500000,
  currency: '₹',
  salaries: 35000,
  marketingSpend: 10000,
  products: [
    { id: '1', name: 'Primary Product', price: 350, costPerUnit: 140, salesVolumeShare: 0.8 },
    { id: '2', name: 'Add-on / Dessert', price: 150, costPerUnit: 45, salesVolumeShare: 0.4 },
  ],
  seasons: DEFAULT_SEASONS,
  shocks: [
    { name: 'Equip. Maintenance', amount: 5000, frequency: 'monthly' }
  ],
  opportunityCostJob: 60000,
  opportunityCostFD: 7,
  // Initial simplified setup values
  avgBill: 350,
  variableCostPercent: 40,
};
