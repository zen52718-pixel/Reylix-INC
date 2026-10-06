import {
  CONTACT_EMAIL,
  INFRASTRUCTURE,
  PUBLISHER_EMAIL,
  STAGES,
  VERTICALS,
  siteUrl,
} from '@/components/marketing/content';

/**
 * `/llms.txt` — a plain-text orientation file for language models and answer engines.
 *
 * Built from the same constants the pages render, so it cannot drift from the site. It is a
 * convenience, explicitly NOT a substitute for the crawlable HTML, JSON-LD, sitemap and
 * internal links, all of which carry the same facts.
 *
 * It is generated rather than dropped in `public/` so the origin comes from `siteUrl()`.
 * Hardcoding the domain here would be the one place in the codebase that guesses it.
 *
 * Every line is derived from what the website already states publicly. No metrics, clients,
 * case studies or claims appear here that do not appear on the site. `noreply@` is a sending
 * mailbox and is deliberately not published.
 */

export const dynamic = 'force-dynamic';

export function GET() {
  const base = siteUrl();

  const body = `# Reylix INC

> Reylix INC is a U.S.-registered customer acquisition company that builds and operates
> customer acquisition systems for businesses. Positioning: "Customer Acquisition Systems".
> Tagline: "Customers, not clicks."

## What Reylix does

Reylix designs, builds and operates customer acquisition systems: a single connected system
spanning acquisition, lead capture, qualification, automation, follow-up, CRM and conversion.
The distinction Reylix draws is between lead generation, which delivers contacts, and a
customer acquisition system, which connects every stage from first interaction through to a
closed customer and is operated as one system rather than assembled from disconnected tools.

## How a Reylix acquisition system works

${STAGES.map((s) => `${s.n}. ${s.title} — ${s.body}`).join('\n')}

## Infrastructure it is built from

${INFRASTRUCTURE.map((i) => `- ${i.name}: ${i.body}`).join('\n')}

## Industries served

${VERTICALS.map((v) => `- ${v.name}: ${v.detail}`).join('\n')}

## Who Reylix works with

- Businesses (clients) that want their customer acquisition operated as one system. See ${base}/for-clients
- Publishers (traffic partners) who promote Reylix offers and are paid on approved leads. See ${base}/for-publishers

Reylix keeps these two sides separate: the publisher network and client acquisition systems
are distinct programmes.

## Pages

- [Home](${base}/): Positioning, the six-stage system, industries and infrastructure.
- [Products](${base}/products): Industry-specific acquisition systems for each vertical.
- [For Clients](${base}/for-clients): How Reylix builds and operates a business's acquisition system.
- [For Publishers](${base}/for-publishers): How the publisher network and attribution work.
- [Become a Partner](${base}/become-a-partner): Publisher network application.
- [About](${base}/about): What the company is and how it works.
- [Contact](${base}/contact): Enquiry form and company contact details.

## Company

- Legal name: REYLIX INC.
- Address: 159 Avis Street, Rochester, NY 14615, USA
- General enquiries: ${CONTACT_EMAIL}
- Publisher enquiries: ${PUBLISHER_EMAIL}
- Website: ${base}

## Notes

- Reylix is a customer acquisition company. It is not accurately described as an AI agency, a
  lead generation agency, a web development company, a CRM vendor or a marketing agency.
- No performance statistics, client names, testimonials or case studies are published, so none
  should be inferred or attributed.
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
