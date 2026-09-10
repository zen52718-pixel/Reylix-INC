import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '@/src/domain/errors';
import { createMemoryRepositories } from '@/src/repositories/memory';
import { InquiryService } from '@/src/services/InquiryService';
import type { AdminNotifier } from '@/src/services/notifications';

function build() {
  const repos = createMemoryRepositories();
  const notifier: AdminNotifier = {
    notifyNewLead: vi.fn().mockResolvedValue(undefined),
    notifyNewInquiry: vi.fn().mockResolvedValue(undefined),
  };
  return { repos, notifier, service: new InquiryService(repos.inquiries, notifier) };
}

describe('InquiryService', () => {
  it('creates an inquiry and notifies admin', async () => {
    const { service, notifier } = build();
    const inquiry = await service.create({
      name: '  Jane Doe ',
      email: '  Jane@Example.COM ',
      interestType: 'client',
      message: '  We need customers.  ',
    });

    expect(inquiry.name).toBe('Jane Doe');
    expect(inquiry.email).toBe('jane@example.com');
    expect(inquiry.interestType).toBe('client');
    expect(inquiry.message).toBe('We need customers.');
    expect(inquiry.handled).toBe(false);
    expect(notifier.notifyNewInquiry).toHaveBeenCalledOnce();
  });

  it('validates name and email', async () => {
    const { service } = build();
    await expect(service.create({ name: ' ', email: 'a@b.com' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(service.create({ name: 'A', email: 'nope' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('falls back to `other` for an unrecognised interest type', async () => {
    const { service } = build();
    const inquiry = await service.create({
      name: 'A',
      email: 'a@b.com',
      interestType: 'something-else',
    });
    expect(inquiry.interestType).toBe('other');
  });

  describe('consent', () => {
    it('stores consent as structured fields, not prose', async () => {
      const { service } = build();
      const at = '2026-08-24T10:00:00.000Z';
      const inquiry = await service.create({
        name: 'A',
        email: 'a@b.com',
        consentGranted: true,
        consentWording: 'I agree to be contacted.',
        consentAt: at,
        consentIp: '203.0.113.5',
      });

      expect(inquiry.consentGranted).toBe(true);
      expect(inquiry.consentWording).toBe('I agree to be contacted.');
      expect(inquiry.consentAt).toBe(at);
      expect(inquiry.consentIp).toBe('203.0.113.5');
      // The old behaviour appended consent into the message; it must not do that any more.
      expect(inquiry.message).toBeUndefined();
    });

    it('does not record wording or a timestamp when consent was not granted', async () => {
      const { service } = build();
      const inquiry = await service.create({
        name: 'A',
        email: 'a@b.com',
        consentGranted: false,
        consentWording: 'I agree to be contacted.',
        consentIp: '203.0.113.5',
      });

      // Storing wording beside a false flag would misrepresent what happened.
      expect(inquiry.consentGranted).toBe(false);
      expect(inquiry.consentWording).toBeUndefined();
      expect(inquiry.consentAt).toBeUndefined();
      expect(inquiry.consentIp).toBeUndefined();
    });

    it('defaults consent to not granted when the field is absent', async () => {
      const { service } = build();
      const inquiry = await service.create({ name: 'A', email: 'a@b.com' });
      expect(inquiry.consentGranted).toBe(false);
    });
  });

  /**
   * Serverless-critical. A function can be frozen the instant its response is returned, so a
   * fire-and-forget notification is one that never leaves the machine. While there is no
   * durable store, that notification is the only copy of the submission.
   */
  it('waits for the admin notification before resolving', async () => {
    const repos = createMemoryRepositories();
    let settled = false;
    const notifier: AdminNotifier = {
      notifyNewLead: vi.fn().mockResolvedValue(undefined),
      notifyNewInquiry: vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              settled = true;
              resolve();
            }, 20);
          }),
      ),
    };
    const service = new InquiryService(repos.inquiries, notifier);

    await service.create({ name: 'A', email: 'a@b.com', consentGranted: true });

    expect(settled).toBe(true);
  });

  it('still records the inquiry when the notifier throws', async () => {
    const repos = createMemoryRepositories();
    const notifier: AdminNotifier = {
      notifyNewLead: vi.fn().mockResolvedValue(undefined),
      notifyNewInquiry: vi.fn().mockRejectedValue(new Error('provider down')),
    };
    const service = new InquiryService(repos.inquiries, notifier);

    // A delivery problem must never turn a correct submission into an error for the visitor.
    await expect(
      service.create({ name: 'A', email: 'a@b.com', consentGranted: true }),
    ).resolves.toMatchObject({ email: 'a@b.com' });
    expect(await repos.inquiries.list()).toHaveLength(1);
  });

  it('an inquiry is not a lead: it never reaches the leads store', async () => {
    const { service, repos } = build();
    await service.create({ name: 'A', email: 'a@b.com', consentGranted: true });

    expect(await repos.inquiries.list()).toHaveLength(1);
    // The company's front door and the acquisition pipeline are separate systems.
    expect(await repos.leads.list()).toHaveLength(0);
    expect(await repos.leadAttributions.listByPublisher('any')).toHaveLength(0);
    expect(await repos.commissions.list()).toHaveLength(0);
  });
});
