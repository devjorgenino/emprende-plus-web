// IndexedDB wrapper for Emprende+ PWA
// Self-contained, no external dependencies

const DB_NAME = 'emprende-plus-db';
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

export const db = {
  async getDatabase(): Promise<IDBDatabase> {
    if (dbInstance) {
      return dbInstance;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Services
        const services = db.createObjectStore('services', { keyPath: 'id' });
        services.createIndex('name', 'name', { unique: false });
        services.createIndex('createdAt', 'createdAt', { unique: false });

        // Quotes
        const quotes = db.createObjectStore('quotes', { keyPath: 'id' });
        quotes.createIndex('status', 'status', { unique: false });
        quotes.createIndex('createdAt', 'createdAt', { unique: false });

        // Quote items
        db.createObjectStore('quoteItems', { keyPath: 'id' });

        // Sales
        db.createObjectStore('sales', { keyPath: 'id' });

        // Sale items
        db.createObjectStore('saleItems', { keyPath: 'id' });

        // Inventory
        db.createObjectStore('inventory', { keyPath: 'id' });

        // Expenses
        db.createObjectStore('expenses', { keyPath: 'id' });

        // Clients
        db.createObjectStore('clients', { keyPath: 'id' });

        // Exchange rates
        db.createObjectStore('exchangeRates', { keyPath: 'id' });
      };
    });
  }
};