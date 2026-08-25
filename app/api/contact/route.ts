import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { CONSENT_CONTACT } from '@/components/marketing/content';
import { errorResponse, jsonError, jsonOk } from '@/src/lib/http';
import { clientIp, publicFormLimiter } from '@/src/lib/public-guard';
import { getServices } from '@/src/services';

export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address').max(200),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  interestType: z.enum(['brand', 'publisher', 'other']).default('other'),
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

    const contact = await getServices().contact.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      interestType: input.interestType,
      message: withConsentRecord(input.message, request),
    });

    return jsonOk({ id: contact.id, received: true }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Append the consent record to the message body.
 *
 * This is a stopgap. A defensible TCPA record needs the consent flag, the exact wording
 * shown, the timestamp and the IP as first-class columns — not prose in a free-text field.
 * Adding those columns means changing the domain model, which is out of scope for this
 * sprint, so the facts are at least captured verbatim until that lands.
 */
function withConsentRecord(message: string | undefined, request: NextRequest): string {
  const record = [
    '--- consent record ---',
    'consent: granted',
    `at: ${new Date().toISOString()}`,
    `ip: ${clientIp(request)}`,
    `wording: "${CONSENT_CONTACT}"`,
  ].join('\n');
  return message ? `${message}\n\n${record}` : record;
}
