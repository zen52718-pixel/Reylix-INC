import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '@/src/domain/errors';
import { MemoryContactRepo } from '@/src/repositories/memory/MemoryContactRepo';
import { ContactService } from '@/src/services/ContactService';
import type { AdminNotifier } from '@/src/services/notifications';

function setup() {
  const contacts = new MemoryContactRepo();
  const notifier: AdminNotifier = {
    notifyNewLead: vi.fn(async () => undefined),
    notifyNewContact: vi.fn(async () => undefined),
  };
  return { service: new ContactService(contacts, notifier), contacts, notifier };
}

describe('ContactService', () => {
  it('creates a contact, defaults interestType, notifies admin', async () => {
    const { service, notifier } = setup();
    const c = await service.create({ name: 'Jane', email: 'JANE@x.com', message: 'hi' });
    expect(c.handled).toBe(false);
    expect(c.email).toBe('jane@x.com');
    expect(c.interestType).toBe('other');
    expect(notifier.notifyNewContact).toHaveBeenCalledOnce();
  });

  it('keeps a valid interest type', async () => {
    const { service } = setup();
    const c = await service.create({ name: 'Jane', email: 'jane@x.com', interestType: 'publisher' });
    expect(c.interestType).toBe('publisher');
  });

  it('validates name and email', async () => {
    const { service } = setup();
    await expect(service.create({ name: '', email: 'a@b.com' })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.create({ name: 'X', email: 'bad' })).rejects.toBeInstanceOf(ValidationError);
  });
});
