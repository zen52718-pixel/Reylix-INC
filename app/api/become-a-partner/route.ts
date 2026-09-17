import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { CONSENT_PARTNER } from '@/components/marketing/content';
import { errorResponse, jsonError, jsonOk } from '@/src/lib/http';
import { clientIp, publicFormLimiter } from '@/src/lib/public-guard';
import { getServices } from '@/src/services';

export const dynamic = 'force-dynamic';

const PartnerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address').max(200),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  website: z.string().trim().max(300).optional(),
  audienceType: z.enum(['paid', 'seo', 'social', 'email', 'other']).default('other'),
  audienceSize: z.string().trim().max(80).optional(),
  promoDescription: z.string().trim().min(1, 'Tell us how you plan to promote').max(4000),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required before we can contact you' }),
  }),
  // Honeypot. Not max(0) — see the note in the contact route.
  hp: z.string().optional(),
});

const AUDIENCE_LABEL: Record<string, string> = {
  paid: 'Paid traffic',
  seo: 'SEO / organic',
  social: 'Social',
  email: 'Email list',
  other: 'Other',
};

/**
 * Partner applications are recorded as INQUIRIES, not as Publisher records.
 *
 * Creating a real Publisher from a public form would put rows into the acquisition
 * platform before there is any admin screen to review or approve them, leaving
 * applications stranded. Capturing the interest is the honest V1 behaviour; promoting
 * these to real publisher applications belongs with the admin portal.
 *
 * An Inquiry is also emphatically not a consumer Lead: it carries no attribution, no
 * offer and no commission.
 */
export async function POST(request: NextRequest) {
  try {
    const limit = publicFormLimiter.check(clientIp(request));
    if (!limit.allowed) {
      return jsonError(429, 'RATE_LIMITED', 'Too many submissions. Try again shortly.');
    }

    const parsed = PartnerSchema.safeParse(await request.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(400, 'VALIDATION_ERROR', first?.message ?? 'Invalid submission', {
        field: first?.path.join('.'),
      });
    }

    const input = parsed.data;
    if (input.hp) return jsonOk({ received: true });

    const inquiry = await getServices().inquiries.create({
      // Fixed by the endpoint: partner applications go to the publisher inbox.
      channel: 'partner_application',
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      interestType: 'publisher',
      message: buildApplication(input),
      consentGranted: true,
      consentWording: CONSENT_PARTNER,
      consentAt: new Date().toISOString(),
      consentIp: clientIp(request),
    });

    return jsonOk({ id: inquiry.id, received: true }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

/** Flatten the structured answers into the inquiry message so nothing is lost. */
function buildApplication(input: z.infer<typeof PartnerSchema>): string {
  return [
    '--- partner application ---',
    `audience: ${AUDIENCE_LABEL[input.audienceType] ?? input.audienceType}`,
    input.audienceSize ? `audience size: ${input.audienceSize}` : null,
    input.website ? `website: ${input.website}` : null,
    '',
    'how they plan to promote:',
    input.promoDescription,
  ]
    .filter((line) => line !== null)
    .join('\n');
}
