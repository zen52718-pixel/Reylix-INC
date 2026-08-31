import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '@/src/domain/errors';
import { MemoryPublisherRepo } from '@/src/repositories/memory/MemoryPublisherRepo';
import { PublisherService } from '@/src/services/PublisherService';

describe('PublisherService', () => {
  let service: PublisherService;

  beforeEach(() => {
    service = new PublisherService(new MemoryPublisherRepo());
  });

  it('creates a publisher, normalizing code/email and defaulting status to pending', async () => {
    const publisher = await service.create({
      publisherCode: ' ahmed ',
      fullName: 'Ahmed Khan',
      email: 'Ahmed@Example.com',
      phone: '+15551234567',
    });

    expect(publisher.publisherCode).toBe('AHMED');
    expect(publisher.email).toBe('ahmed@example.com');
    expect(publisher.status).toBe('pending');
  });

  it('rejects a duplicate publisher code', async () => {
    const base = {
      publisherCode: 'AHMED',
      fullName: 'Ahmed',
      phone: '1',
    };
    await service.create({ ...base, email: 'a@example.com' });
    await expect(service.create({ ...base, email: 'b@example.com' })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('rejects a duplicate email (case-insensitive)', async () => {
    await service.create({
      publisherCode: 'AHMED',
      fullName: 'Ahmed',
      email: 'ahmed@example.com',
      phone: '1',
    });
    await expect(
      service.create({
        publisherCode: 'SARA',
        fullName: 'Sara',
        email: 'AHMED@example.com',
        phone: '2',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('validates required fields and email format', async () => {
    await expect(
      service.create({ publisherCode: '', fullName: 'X', email: 'x@y.com', phone: '1' }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.create({ publisherCode: 'X', fullName: 'X', email: 'not-an-email', phone: '1' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates a publisher and guards code uniqueness against other rows', async () => {
    const a = await service.create({
      publisherCode: 'AHMED',
      fullName: 'Ahmed',
      email: 'a@example.com',
      phone: '1',
    });
    await service.create({
      publisherCode: 'SARA',
      fullName: 'Sara',
      email: 's@example.com',
      phone: '2',
    });

    const updated = await service.update(a.id, { status: 'active' });
    expect(updated.status).toBe('active');

    await expect(service.update(a.id, { publisherCode: 'SARA' })).rejects.toBeInstanceOf(ConflictError);
  });

  describe('rejection', () => {
    it('rejects an application with a required reason', async () => {
      const created = await service.apply({
        fullName: 'Rejected Applicant',
        email: 'nope@example.com',
        phone: '+15550000009',
      });

      const rejected = await service.reject(created.id, 'admin@reylix.com', 'Traffic source not permitted');
      expect(rejected.status).toBe('rejected');
    });

    it('requires a reason', async () => {
      const created = await service.apply({
        fullName: 'Applicant',
        email: 'a2@example.com',
        phone: '+15550000010',
      });
      await expect(service.reject(created.id, 'admin@reylix.com', '  ')).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it('rejected is distinct from suspended', async () => {
      // "We said no" and "we switched you off" are different facts a publisher may ask about.
      const a = await service.apply({ fullName: 'A', email: 'ra@example.com', phone: '+15550000011' });
      const b = await service.apply({ fullName: 'B', email: 'rb@example.com', phone: '+15550000012' });

      const rejected = await service.reject(a.id, 'admin', 'not a fit');
      const suspended = await service.suspend(b.id, 'admin');

      expect(rejected.status).toBe('rejected');
      expect(suspended.status).toBe('suspended');
      expect(rejected.status).not.toBe(suspended.status);
    });
  });
});
