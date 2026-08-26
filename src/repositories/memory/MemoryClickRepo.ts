import { randomUUID } from 'node:crypto';
import type { Click } from '@/src/domain/types';
import type { ClickRepo, DateRange } from '@/src/repositories/interfaces';
import { withinRange } from '@/src/repositories/memory/_util';

export class MemoryClickRepo implements ClickRepo {
  private readonly rows: Click[] = [];

  async append(c: Omit<Click, 'id'>): Promise<Click> {
    const click: Click = { ...c, id: randomUUID() };
    this.rows.push(click);
    return click;
  }

  async listByPublisher(publisherId: string, range?: DateRange): Promise<Click[]> {
    return this.rows.filter((c) => c.publisherId === publisherId && withinRange(c.clickedAt, range));
  }

  async recentDedup(dedupKey: string, withinMs: number): Promise<boolean> {
    const threshold = Date.now() - withinMs;
    return this.rows.some((c) => c.dedupKey === dedupKey && Date.parse(c.clickedAt) >= threshold);
  }
}
