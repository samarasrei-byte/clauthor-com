/**
 * deptSelection — carrinho global de departamentos (Fase 3).
 *
 * Regras:
 * - Um departamento por linha; sem quantidade (não faz sentido "2x Comercial").
 * - Persistência em localStorage pra sobreviver a refresh e ao redirect PayPal.
 * - Toggle idempotente (add duplicado é no-op).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  priceMonthly: number;
  agentSlugs: string[];
}

interface DeptSelectionState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  toggle: (item: CartItem) => void;
  clear: () => void;
  has: (id: string) => boolean;
  total: () => number;
}

export const useDeptSelection = create<DeptSelectionState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) =>
          s.items.some((i) => i.id === item.id) ? s : { items: [...s.items, item] },
        ),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      toggle: (item) =>
        set((s) =>
          s.items.some((i) => i.id === item.id)
            ? { items: s.items.filter((i) => i.id !== item.id) }
            : { items: [...s.items, item] },
        ),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i.id === id),
      total: () => get().items.reduce((acc, i) => acc + i.priceMonthly, 0),
    }),
    { name: "clauthor_dept_cart_v1" },
  ),
);
