import { type Service } from './types';
import { db } from '../db';

export async function getAllServices(): Promise<Service[]> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['services'], 'readonly');
    const store = transaction.objectStore('services');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as Service[];
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['services'], 'readonly');
    const store = transaction.objectStore('services');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function createService(service: Service): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['services'], 'readwrite');
    const store = transaction.objectStore('services');
    const request = store.add(service);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateService(id: string, data: Partial<Service>): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['services'], 'readwrite');
    const store = transaction.objectStore('services');
    const request = store.get(id);

    request.onsuccess = () => {
      const existing = request.result as Service;
      if (!existing) {
        reject(new Error('Servicio no encontrado'));
        return;
      }
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      const updateRequest = store.put(updated);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteService(id: string): Promise<void> {
  const database = await db.getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['services'], 'readwrite');
    const store = transaction.objectStore('services');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}