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
});
