import { describe, expect, it } from 'vitest';
import { toCsv } from '@/src/lib/csv';

describe('toCsv', () => {
  it('builds rows with a header line', () => {
    const csv = toCsv(['a', 'b'], [['1', '2'], ['3', '4']]);
    expect(csv).toBe('a,b\r\n1,2\r\n3,4');
  });

  it('quotes and escapes fields with commas, quotes, and newlines', () => {
    const csv = toCsv(['name', 'note'], [['Doe, Jane', 'said "hi"\nbye']]);
    expect(csv).toBe('name,note\r\n"Doe, Jane","said ""hi""\nbye"');
  });

  it('renders null/undefined as empty cells and numbers as-is', () => {
    const csv = toCsv(['x', 'y', 'z'], [[null, undefined, 42]]);
    expect(csv).toBe('x,y,z\r\n,,42');
  });
});
