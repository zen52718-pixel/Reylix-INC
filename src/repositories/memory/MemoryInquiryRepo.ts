import { randomUUID } from 'node:crypto';
import type { Inquiry } from '@/src/domain/types';
import type { InquiryRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryInquiryRepo implements InquiryRepo {
  private readonly store = new Map<string, Inquiry>();

  async append(i: Omit<Inquiry, 'id'>): Promise<Inquiry> {
    const inquiry: Inquiry = { ...i, id: randomUUID() };
    this.store.set(inquiry.id, inquiry);
    return inquiry;
  }

  async list(filter?: Partial<Inquiry>): Promise<Inquiry[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter)) : rows;
  }
}
