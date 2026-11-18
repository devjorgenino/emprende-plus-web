import { type Service, type Quote, type Sale, type InventoryItem, type Expense, type Client, type ExchangeRate } from '@/types';

export interface ServiceEntity extends Service {}
export interface QuoteEntity extends Quote {}
export interface QuoteItemEntity {
  id: string;
  quoteId: string;
  serviceId: string;
  serviceName: string;
  priceUSD: number;
  quantity: number;
  subtotalUSD: number;
}
export interface SaleEntity extends Sale {}
export interface SaleItemEntity {
  id: string;
  saleId: string;
  serviceId: string;
  serviceName: string;
  priceUSD: number;
  quantity: number;
  subtotalUSD: number;
}
export interface InventoryItemEntity extends InventoryItem {}
export interface ExpenseEntity extends Expense {}
export interface ClientEntity extends Client {}
export interface ExchangeRateEntity extends ExchangeRate {
  id: 'current';
  rate: number;
  fetchedAt: string;
  source: 'bcv' | 'manual' | 'cached';
}

// Table schemas for Dexie
export const serviceSchema = '++id, name, createdAt';
export const quoteSchema = '++id, totalUSD, totalVES, createdAt, status';
export const quoteItemSchema = '++id, quoteId, serviceId';
export const saleSchema = '++id, totalUSD, totalVES, createdAt';
export const saleItemSchema = '++id, saleId, serviceId';
export const inventorySchema = '++id, name, category, createdAt';
export const expenseSchema = '++id, description, category, createdAt';
export const clientSchema = '++id, name, phone, email, createdAt';
export const exchangeRateSchema = 'id, rate, fetchedAt';