import { describe, expect, it } from 'vitest';
import {
  consumerDedupKey,
  formatPhoneUS,
  formatRefCode,
  normalizePhoneUS,
  parseRefCode,
  resolveLeadDedupWindowMinutes,
} from '@/src/domain/value-objects';

describe('ref code value object', () => {
  it('formats deterministically and uppercases', () => {
    expect(formatRefCode('ahmed', 'mva1')).toBe('AHMED-MVA1');
    expect(formatRefCode(' Ahmed ', ' MvA1 ')).toBe('AHMED-MVA1');
  });

  it('parses a valid ref code', () => {
    expect(parseRefCode('AHMED-MVA1')).toEqual({ publisherCode: 'AHMED', offerCode: 'MVA1' });
    expect(parseRefCode('ahmed-mva1')).toEqual({ publisherCode: 'AHMED', offerCode: 'MVA1' });
  });

  it('rejects malformed ref codes', () => {
    expect(parseRefCode('')).toBeNull();
    expect(parseRefCode('NOHYPHEN')).toBeNull();
    expect(parseRefCode('-MVA1')).toBeNull();
    expect(parseRefCode('AHMED-')).toBeNull();
  });

  it('round-trips format → parse', () => {
    const ref = formatRefCode('AHMED', 'MVA1');
    expect(parseRefCode(ref)).toEqual({ publisherCode: 'AHMED', offerCode: 'MVA1' });
  });
});

describe('US phone normalization', () => {
  it('normalizes common US formats to E.164', () => {
    expect(normalizePhoneUS('(555) 123-4567')).toBe('+15551234567');
    expect(normalizePhoneUS('555-123-4567')).toBe('+15551234567');
    expect(normalizePhoneUS('1 555 123 4567')).toBe('+15551234567');
    expect(normalizePhoneUS('+15551234567')).toBe('+15551234567');
  });

  it('returns empty for empty input', () => {
    expect(normalizePhoneUS('')).toBe('');
  });

  it('leaves an unrecognizable number stripped rather than mangled', () => {
    // A wrong number is worse than an obviously unformatted one.
    expect(normalizePhoneUS('12345')).toBe('12345');
  });
});

describe('formatPhoneUS', () => {
  it('renders E.164 back to US display form', () => {
    expect(formatPhoneUS('+15551234567')).toBe('(555) 123-4567');
  });

  it('passes through anything that is not a US E.164 number', () => {
    expect(formatPhoneUS('+442071234567')).toBe('+442071234567');
  });
});

describe('resolveLeadDedupWindowMinutes', () => {
  it('prefers the offer window over the campaign window', () => {
    expect(resolveLeadDedupWindowMinutes(120, 60)).toBe(120);
  });

  it('falls back to the campaign window when the offer sets none', () => {
    expect(resolveLeadDedupWindowMinutes(undefined, 60)).toBe(60);
    expect(resolveLeadDedupWindowMinutes(null, 60)).toBe(60);
  });

  it('returns null when neither level is configured', () => {
    // Deliberately NOT a default value: guessing this would change publisher pay.
    expect(resolveLeadDedupWindowMinutes(undefined, undefined)).toBeNull();
    expect(resolveLeadDedupWindowMinutes(0, 0)).toBeNull();
  });
});

describe('consumerDedupKey', () => {
  it('is stable for the same consumer on the same offer', () => {
    const a = consumerDedupKey('offer-1', 'Sara@Example.com');
    const b = consumerDedupKey('offer-1', 'sara@example.com');
    expect(a).toBe(b);
  });

  it('differs across offers, so one offer cannot suppress another', () => {
    expect(consumerDedupKey('offer-1', 'sara@example.com')).not.toBe(
      consumerDedupKey('offer-2', 'sara@example.com'),
    );
  });

  it('prefers email, and falls back to a normalized phone number', () => {
    expect(consumerDedupKey('offer-1', undefined, '(555) 123-4567')).toBe(
      consumerDedupKey('offer-1', undefined, '555-123-4567'),
    );
    expect(consumerDedupKey('offer-1', 'sara@example.com', '(555) 123-4567')).not.toBe(
      consumerDedupKey('offer-1', undefined, '(555) 123-4567'),
    );
  });

  it('returns null when there is nothing to identify the consumer by', () => {
    // Collapsing anonymous submissions together would merge unrelated people.
    expect(consumerDedupKey('offer-1')).toBeNull();
    expect(consumerDedupKey('offer-1', '   ', '  ')).toBeNull();
  });
});
