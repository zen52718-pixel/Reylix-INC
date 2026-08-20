/**
 * Small storage-agnostic value helpers used across services.
 *
 * Referral code format: `{PUBLISHERCODE}-{OFFERCODE}`, e.g. `AHMED-MVA1`.
 * Codes are uppercase alphanumeric; the publisher code is everything before the first
 * hyphen, the offer code is everything after it.
 */

export interface RefCodeParts {
  publisherCode: string;
  offerCode: string;
}

/** Deterministic, idempotent referral code: same publisher+offer always yields the same code. */
export function formatRefCode(publisherCode: string, offerCode: string): string {
  return `${publisherCode.trim().toUpperCase()}-${offerCode.trim().toUpperCase()}`;
}

/** Parse a ref code into its parts, or `null` if it is not a valid `PUBLISHER-OFFER` form. */
export function parseRefCode(ref: string): RefCodeParts | null {
  if (!ref) return null;
  const trimmed = ref.trim().toUpperCase();
  const idx = trimmed.indexOf('-');
  if (idx <= 0 || idx >= trimmed.length - 1) return null;
  const publisherCode = trimmed.slice(0, idx);
  const offerCode = trimmed.slice(idx + 1);
  if (!publisherCode || !offerCode) return null;
  return { publisherCode, offerCode };
}

/**
 * Best-effort normalization of a US phone number toward E.164 (+1XXXXXXXXXX).
 *
 * Handles the shapes a US lead form actually receives: (555) 123-4567, 555-123-4567,
 * 1-555-123-4567, +1 555 123 4567. Conservative by design — anything that is not a
 * recognizable US number is returned stripped of formatting rather than mangled, so a
 * bad input never silently becomes a valid-looking wrong number.
 */
export function normalizePhoneUS(input: string): string {
  if (!input) return '';
  const s = input.replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (s.startsWith('011')) return `+${s.slice(3)}`;
  return s;
}

/** Format an E.164 US number back to (555) 123-4567 for display. Falls back to the input. */
export function formatPhoneUS(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec((e164 ?? '').trim());
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : (e164 ?? '');
}
