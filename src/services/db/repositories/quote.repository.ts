import { type Quote, type QuoteItem } from './types';
import { db } from '../db';
import { generateId } from '@/utils/id';

export async function getAllQuotes(): Promise<Quote[]> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['quotes'], 'readonly');
    const store = transaction.objectStore('quotes');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as Quote[];
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getQuoteById(id: string): Promise<Quote | undefined> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['quotes'], 'readonly');
    const store = transaction.objectStore('quotes');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getQuoteItems(quoteId: string): Promise<QuoteItem[]> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['quoteItems'], 'readonly');
    const store = transaction.objectStore('quoteItems');
    const index = store.index('quoteId');
    const request = index.getAll(quoteId);

    request.onsuccess = () => resolve(request.result as QuoteItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function createQuoteWithItems(
  quote: Omit<Quote, 'id'>,
  items: Omit<QuoteItem, 'id' | 'subtotalUSD'>[],
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();

  const totalUSD = items.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);
  const totalVES = Math.round(totalUSD * quote.exchangeRate * 100) / 100;

  const fullQuote: Quote = {
    ...quote,
    id,
    totalUSD,
    totalVES,
    createdAt: now,
  };

  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['quotes', 'quoteItems'], 'readwrite');
    const quotesStore = transaction.objectStore('quotes');
    const itemsStore = transaction.objectStore('quoteItems');

    quotesStore.add(fullQuote);

    items.forEach((item) => {
      itemsStore.add({
        id: generateId(),
        quoteId: id,
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

export async function updateQuoteStatus(id: string, status: Quote['status']): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['quotes'], 'readwrite');
    const store = transaction.objectStore('quotes');
    const request = store.get(id);

    request.onsuccess = () => {
      const quote = request.result as Quote;
      if (quote) {
        quote.status = status;
        store.put(quote);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteQuote(id: string): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['quotes', 'quoteItems'], 'readwrite');
    const quotesStore = transaction.objectStore('quotes');
    const itemsStore = transaction.objectStore('quoteItems');
    const index = itemsStore.index('quoteId');

    quotesStore.delete(id);
    index.getAllKeys(id).onsuccess = (event: any) => {
      const keys = event.target.result;
      keys.forEach((key: string) => itemsStore.delete(key));
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}