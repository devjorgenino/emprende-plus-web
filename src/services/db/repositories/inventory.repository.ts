import { type InventoryItem } from './types';
import { db } from '../db';
import { generateId } from '@/utils/id';

export async function getAllItems(): Promise<InventoryItem[]> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['inventory'], 'readonly');
    const store = transaction.objectStore('inventory');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as InventoryItem[];
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getItemById(id: string): Promise<InventoryItem | undefined> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['inventory'], 'readonly');
    const store = transaction.objectStore('inventory');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function createItem(item: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['inventory'], 'readwrite');
    const store = transaction.objectStore('inventory');
    const request = store.add({ ...item, id, createdAt: now });

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function updateItem(id: string, data: Partial<InventoryItem>): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['inventory'], 'readwrite');
    const store = transaction.objectStore('inventory');

    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (existing) {
        const updated = { ...existing, ...data };
        store.put(updated);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteItem(id: string): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['inventory'], 'readwrite');
    const store = transaction.objectStore('inventory');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getItemsByCategory(category: string): Promise<InventoryItem[]> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['inventory'], 'readonly');
    const store = transaction.objectStore('inventory');
    const index = store.index('category');
    const request = index.getAll(category);

    request.onsuccess = () => resolve(request.result as InventoryItem[]);
    request.onerror = () => reject(request.error);
  });
}