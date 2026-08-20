import { describe, expect, it } from 'vitest';
import {
  formatPhoneUS,
  formatRefCode,
  normalizePhoneUS,
  parseRefCode,
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
