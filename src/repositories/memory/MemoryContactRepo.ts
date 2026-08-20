import { randomUUID } from 'node:crypto';
import type { Contact } from '@/src/domain/types';
import type { ContactRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryContactRepo implements ContactRepo {
  private readonly store = new Map<string, Contact>();

  async append(c: Omit<Contact, 'id'>): Promise<Contact> {
    const contact: Contact = { ...c, id: randomUUID() };
    this.store.set(contact.id, contact);
    return contact;
  }

  async list(filter?: Partial<Contact>): Promise<Contact[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter)) : rows;
  }
}
