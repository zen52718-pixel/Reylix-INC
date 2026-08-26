import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { CONSENT_CONTACT } from '@/components/marketing/content';
import { errorResponse, jsonError, jsonOk } from '@/src/lib/http';
import { clientIp, publicFormLimiter } from '@/src/lib/public-guard';
import { getServices } from '@/src/services';

export const dynamic = 'force-dynamic';

/**
 * The website sends `brand` for "I need customers", which is the vocabulary that shipped
 * with the public site. The domain now calls that party a Client.
 *
 * The translation happens HERE, at the boundary, so the wrong word never reaches the core
 * model and no website component, label or form value has to change. `client` is also
 * accepted so a future form can send the corrected value without another shim.
 */
const INTEREST_ALIASES: Record<string, 'client' | 'publisher' | 'other'> = {
  brand: 'client',
  client: 'client',
  publisher: 'publisher',
  other: 'other',
};

const ContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address').max(200),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  interestType: z.enum(['brand', 'client', 'publisher', 'other']).default('other'),
  message: z.string().trim().max(4000).optional(),
  // TCPA-style consent. Refused rather than silently ignored when absent.
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required before we can contact you' }),
  }),
  // Honeypot: a real person never fills this, so a value means a bot. Deliberately NOT
  // constrained to max(0) — rejecting it here would return a validation error naming the
  // field, which tells the bot exactly which input to skip next time.
  website: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const limit = publicFormLimiter.check(clientIp(request));
    if (!limit.allowed) {
      return jsonError(429, 'RATE_LIMITED', 'Too many submissions. Try again shortly.');
    }

    const parsed = ContactSchema.safeParse(await request.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, 'VALIDATION_ERROR', first?.message ?? 'Invalid submission', {
        field: first?.path.join('.'),
      });
    }

    const input = parsed.data;
    // Silently accept the honeypot so a bot gets no signal that it was detected.
    if (input.website) return jsonOk({ received: true });

    const inquiry = await getServices().inquiries.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      interestType: INTEREST_ALIASES[input.interestType] ?? 'other',
      message: input.message,
      // Consent is stored as structured fields rather than prose in the message, so it is
      // queryable and auditable.
      consentGranted: true,
      consentWording: CONSENT_CONTACT,
      consentAt: new Date().toISOString(),
      consentIp: clientIp(request),
    });

    return jsonOk({ id: inquiry.id, received: true }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
