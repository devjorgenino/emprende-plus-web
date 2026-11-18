import { create } from 'zustand';
import * as expenseRepository from '../services/db/repositories/expense.repository';
import { getRate, type CachedRate } from '../services/api/bcv.service';
import { type Expense, type PaymentMethod } from '@/types';
import { generateId } from '@/utils/id';

function now(): string {
  return new Date().toISOString();
}

export interface CreateExpenseInput {
  description: string;
  category: string;
  amountUSD: number;
  paymentMethod: PaymentMethod;
  supplier?: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  description?: string;
  category?: string;
  amountUSD?: number;
  amountVES?: number;
  exchangeRate?: number;
  paymentMethod?: PaymentMethod;
  supplier?: string;
  notes?: string;
}

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
}

interface ExpenseActions {
  loadExpenses: () => Promise<void>;
  createExpense: (expense: CreateExpenseInput) => Promise<string>;
  updateExpense: (id: string, data: UpdateExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpenseById: (id: string) => Expense | undefined;
  searchExpenses: (query: string) => Expense[];
  filterByCategory: (category: string) => Expense[];
  exportToCSV: () => Promise<void>;
  getTotalUSD: (startDate?: string, endDate?: string) => number;
  getTotalVES: (startDate?: string, endDate?: string) => number;
  getExpensesByCategory: () => Map<string, number>;
}

export const useExpenseStore = create<ExpenseState & ExpenseActions>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  loadExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await expenseRepository.getAllExpenses();
      set({ expenses, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar egresos';
      set({ error: message, isLoading: false });
    }
  },

  createExpense: async (input) => {
    const cached = getRate();
    const exchangeRate = cached?.rate ?? 735;
    const now = new Date().toISOString();

    const expense: Omit<Expense, 'id'> = {
      description: input.description,
      category: input.category,
      amountUSD: input.amountUSD,
      amountVES: Math.round(input.amountUSD * exchangeRate * 100) / 100,
      exchangeRate,
      paymentMethod: input.paymentMethod,
      supplier: input.supplier,
      notes: input.notes,
      createdAt: now,
    };

    set({ isLoading: true, error: null });
    try {
      const id = await expenseRepository.createExpense(expense);
      set((state) => ({
        expenses: [expense as Expense, ...state.expenses],
        isLoading: false,
      }));
      return id;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear egreso';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  updateExpense: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await expenseRepository.updateExpense(id, data);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar egreso';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expenseRepository.deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar egreso';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  getExpenseById: (id) => {
    return get().expenses.find((e) => e.id === id);
  },

  searchExpenses: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return get().expenses;
    return get().expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.supplier?.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  },

  filterByCategory: (category) => {
    if (category === 'all') return get().expenses;
    return get().expenses.filter((e) => e.category === category);
  },

  exportToCSV: async () => {
    // La exportación CSV se implementará en un componente separado
    // Este método es un placeholder
    const expenses = get().expenses;
    const csvContent = [
      ['ID', 'Descripción', 'Categoría', 'Monto USD', 'Monto VES', 'Proveedor', 'Fecha'],
      ...expenses.map((e) => [
        e.id,
        e.description,
        e.category,
        e.amountUSD,
        e.amountVES,
        e.supplier || '',
        e.createdAt,
      ]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `egresos-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  getTotalUSD: (startDate, endDate) => {
    const expenses = get().expenses;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Date.now();
      return expenses
        .filter((e) => {
          const t = new Date(e.createdAt).getTime();
          return t >= start && t <= end;
        })
        .reduce((sum, e) => sum + e.amountUSD, 0);
    }
    return expenses.reduce((sum, e) => sum + e.amountUSD, 0);
  },

  getTotalVES: (startDate, endDate) => {
    const expenses = get().expenses;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Date.now();
      return expenses
        .filter((e) => {
          const t = new Date(e.createdAt).getTime();
          return t >= start && t <= end;
        })
        .reduce((sum, e) => sum + e.amountVES, 0);
    }
    return expenses.reduce((sum, e) => sum + e.amountVES, 0);
  },

  getExpensesByCategory: () => {
    const byCategory: Map<string, number> = new Map();
    get().expenses.forEach((e) => {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountVES);
    });
    return byCategory;
  },

  getExpenseById: (id: string) => {
    return get().expenses.find((e) => e.id === id);
  },
}));