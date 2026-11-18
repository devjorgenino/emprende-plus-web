import { db } from '../db';
import { type Expense } from './types';
import { generateId } from '@/utils/id';

export async function getAllExpenses(): Promise<Expense[]> {
  return await db.expenses.orderBy('createdAt').reverse().toArray();
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  return await db.expenses.get(id);
}

export async function createExpense(expense: Omit<Expense, 'id'>): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.expenses.add({ ...expense, id, createdAt: now });
  return id;
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<void> {
  await db.expenses.update(id, { ...data });
}

export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id);
}