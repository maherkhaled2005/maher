// src/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  count: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const calcTotals = (items: CartItem[]) => ({
  total: items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0),
  count: items.reduce((s, i) => s + (Number(i.quantity) || 1), 0),
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [], total: 0, count: 0,

      addItem: (item) => {
        const cleanPrice = typeof item.price === 'number'
          ? item.price
          : parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
        const sanitizedItem: Omit<CartItem, 'quantity'> = {
          ...item,
          price: cleanPrice,
        };
        const existing = get().items.find(i => i.id === item.id);
        const newItems = existing
          ? get().items.map(i => i.id === item.id ? { ...i, price: cleanPrice || i.price, quantity: (Number(i.quantity) || 1) + 1 } : i)
          : [...get().items, { ...sanitizedItem, quantity: 1 }];
        set({ items: newItems, ...calcTotals(newItems) });
      },

      removeItem: (id) => {
        const newItems = get().items.filter(i => i.id !== id);
        set({ items: newItems, ...calcTotals(newItems) });
      },

      updateQuantity: (id, quantity) => {
        const qty = Number(quantity) || 0;
        if (qty <= 0) { get().removeItem(id); return; }
        const newItems = get().items.map(i => i.id === id ? { ...i, quantity: qty } : i);
        set({ items: newItems, ...calcTotals(newItems) });
      },

      clearCart: () => set({ items: [], total: 0, count: 0 }),
    }),
    { name: 'cart-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
