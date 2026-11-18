import { type Sale, type SaleItem } from './types';
import { db } from '../db';
import { generateId } from '@/utils/id';

export async function getAllSales(): Promise<Sale[]> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as Sale[];
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['saleItems'], 'readonly');
    const store = transaction.objectStore('saleItems');
    const index = store.index('saleId');
    const request = index.getAll(saleId);

    request.onsuccess = () => resolve(request.result as SaleItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function createSaleWithItems(
  sale: Omit<Sale, 'id'>,
  items: Omit<SaleItem, 'id' | 'subtotalUSD'>[],
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();

  const totalUSD = items.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);
  const totalVES = Math.round(totalUSD * sale.exchangeRate * 100) / 100;

  const fullSale: Sale = {
    ...sale,
    id,
    totalUSD,
    totalVES,
    createdAt: now,
  };

  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales', 'saleItems'], 'readwrite');
    const salesStore = transaction.objectStore('sales');
    const itemsStore = transaction.objectStore('saleItems');

    salesStore.add(fullSale);

    items.forEach((item) => {
      itemsStore.add({
        id: generateId(),
        saleId: id,
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        priceUSD: item.priceUSD,
        quantity: item.quantity,
        subtotalUSD: Math.round(item.priceUSD * item.quantity * 100) / 100,
      });
    });

    transaction.oncomplete = () => resolve(id);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteSale(id: string): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales', 'saleItems'], 'readwrite');
    const salesStore = transaction.objectStore('sales');
    const itemsStore = transaction.objectStore('saleItems');
    const index = itemsStore.index('saleId');

    salesStore.delete(id);
    index.getAllKeys(id).onsuccess = (event: any) => {
      const keys = event.target.result;
      keys.forEach((key: string) => itemsStore.delete(key));
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function updateSale(sale: Sale): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales'], 'readwrite');
    const store = transaction.objectStore('sales');
    const request = store.get(sale.id);

    request.onsuccess = () => {
      if (request.result) {
        store.put(sale);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function searchSales(query: string): Promise<Sale[]> {
  const allSales = await getAllSales();
  const q = query.toLowerCase();
  return allSales.filter((s) => s.clientName?.toLowerCase().includes(q));
}