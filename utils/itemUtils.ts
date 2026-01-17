import { Item } from '../types';

/**
 * Calculate the final selling price of an item after applying offer/discount
 * @param item - The item to calculate final price for
 * @returns The final selling price (after discount if offer is enabled)
 */
export const calculateFinalPrice = (item: Item): number => {
  if (!item.offer || !item.offer.enabled) {
    return item.sellingPrice;
  }
  
  if (item.offer.type === 'percentage') {
    const discount = (item.sellingPrice * item.offer.value) / 100;
    return Math.max(0, item.sellingPrice - discount);
  } else {
    return Math.max(0, item.sellingPrice - item.offer.value);
  }
};
