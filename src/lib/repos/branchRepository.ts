import { db } from '../db';
import type { Branch } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const branchRepository = {
  async getAll(): Promise<Branch[]> {
    return db.branches.toArray();
  },

  async getById(id: string): Promise<Branch | undefined> {
    return db.branches.get(id);
  },

  async create(name: string): Promise<Branch> {
    const branch: Branch = {
      id: uuidv4(),
      name,
      createdAt: new Date(),
    };
    await db.branches.add(branch);
    return branch;
  },

  async update(id: string, name: string): Promise<void> {
    await db.branches.update(id, { name });
  },

  async delete(id: string): Promise<void> {
    await db.branches.delete(id);
  },
};
