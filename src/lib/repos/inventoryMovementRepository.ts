import { db } from '../db';
import type { InventoryMovement, InventoryMovementType, MovementUnit } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateInventoryMovementData {
  sessionId: string;
  branchId: string | null;
  type: InventoryMovementType;
  description: string;
  estimatedQuantity?: number;
  unit?: MovementUnit;
  targetBranchId?: string;
}

export const inventoryMovementRepository = {
  async getBySession(sessionId: string): Promise<InventoryMovement[]> {
    return db.inventoryMovements.where('sessionId').equals(sessionId).toArray();
  },

  async getById(id: string): Promise<InventoryMovement | undefined> {
    return db.inventoryMovements.get(id);
  },

  async create(data: CreateInventoryMovementData): Promise<InventoryMovement> {
    const movement: InventoryMovement = {
      id: uuidv4(),
      sessionId: data.sessionId,
      branchId: data.branchId,
      type: data.type,
      description: data.description,
      estimatedQuantity: data.estimatedQuantity,
      unit: data.unit,
      targetBranchId: data.targetBranchId,
      createdAt: new Date(),
    };
    await db.inventoryMovements.add(movement);
    return movement;
  },

  async delete(id: string): Promise<void> {
    await db.inventoryMovements.delete(id);
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<InventoryMovement[]> {
    return db.inventoryMovements.where('createdAt').between(startDate, endDate).toArray();
  },
};
