import { db } from '../db';
import type { Report, ReportType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const reportRepository = {
  async getAll(): Promise<Report[]> {
    return db.reports.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string): Promise<Report | undefined> {
    return db.reports.get(id);
  },

  async create(data: {
    type: ReportType;
    sessionIds: string[];
    dateFrom?: Date;
    dateTo?: Date;
    branchId?: string;
    fileName: string;
  }): Promise<Report> {
    const report: Report = {
      id: uuidv4(),
      createdAt: new Date(),
      type: data.type,
      sessionIds: data.sessionIds,
      dateFrom: data.dateFrom ?? null,
      dateTo: data.dateTo ?? null,
      branchId: data.branchId ?? null,
      fileName: data.fileName,
    };
    await db.reports.add(report);
    return report;
  },

  async delete(id: string): Promise<void> {
    await db.reports.delete(id);
  },
};
