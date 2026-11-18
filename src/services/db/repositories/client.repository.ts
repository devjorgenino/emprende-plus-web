import { type Client } from '@/types';
import { db } from '../db';
import { generateId } from '@/utils/id';

export async function getAllClients(): Promise<Client[]> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clients'], 'readonly');
    const store = transaction.objectStore('clients');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as Client[];
      results.sort((a, b) => a.name.localeCompare(b.name));
      resolve(results);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getClientById(id: string): Promise<Client | undefined> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clients'], 'readonly');
    const store = transaction.objectStore('clients');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getClientByName(name: string): Promise<Client | undefined> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clients'], 'readonly');
    const store = transaction.objectStore('clients');
    const index = store.index('name');
    const request = index.get(name);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function createClient(client: Client): Promise<string> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clients'], 'readwrite');
    const store = transaction.objectStore('clients');
    const request = store.add(client);

    request.onsuccess = () => resolve(client.id);
    request.onerror = () => reject(request.error);
  });
}

export async function updateClient(id: string, data: Partial<Client>): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clients'], 'readwrite');
    const store = transaction.objectStore('clients');
    const request = store.get(id);

    request.onsuccess = () => {
      if (!request.result) {
        reject(new Error('Cliente no encontrado'));
        return;
      }
      const updated = { ...request.result, ...data };
      const updateRequest = store.put(updated);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteClient(id: string): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clients'], 'readwrite');
    const store = transaction.objectStore('clients');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}