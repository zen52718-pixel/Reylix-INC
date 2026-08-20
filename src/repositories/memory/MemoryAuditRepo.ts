import { randomUUID } from 'node:crypto';
import type { AuditEntry } from '@/src/domain/types';
import type { AuditRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryAuditRepo implements AuditRepo {
  private readonly rows: AuditEntry[] = [];

  async append(entry: Omit<AuditEntry, 'id'>): Promise<void> {
    this.rows.push({ ...entry, id: randomUUID() });
  }

  async list(filter?: Partial<AuditEntry>): Promise<AuditEntry[]> {
    return filter ? this.rows.filter((r) => matchesFilter(r, filter)) : [...this.rows];
  }
}
