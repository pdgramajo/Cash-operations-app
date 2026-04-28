import { db } from '../db';
import type { ReceiptType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const receiptTypeRepository = {
  async getAll(): Promise<ReceiptType[]> {
    return db.receiptTypes.toArray();
  },

  async getById(id: string): Promise<ReceiptType | undefined> {
    return db.receiptTypes.get(id);
  },

  async getByName(name: string): Promise<ReceiptType | undefined> {
    return db.receiptTypes.where('name').equalsIgnoreCase(name).first();
  },

  async create(name: string): Promise<ReceiptType> {
    const existing = await this.getByName(name);
    if (existing) return existing;

    const receiptType: ReceiptType = {
      id: uuidv4(),
      name: name.trim(),
      createdAt: new Date(),
    };
    await db.receiptTypes.add(receiptType);
    return receiptType;
  },

  async delete(id: string): Promise<void> {
    await db.receiptTypes.delete(id);
  },
};
