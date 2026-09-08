# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — the client.** A US business owner or operator who needs more customers and has
run out of patience with the way they currently get them: a real estate agent or brokerage,
a roofing or remodeling contractor, a law firm, an insurance agency, a clinic or healthcare
practice. They are not marketers. They are evaluating Reylix between jobs, on a phone or a
laptop, comparing it against an agency retainer, a lead-gen vendor selling the same lead to
four competitors, and doing nothing. They can tell the difference between traffic and a
booked appointment, and they have paid for the former before.

**Secondary — the publisher.** An affiliate, media buyer, SEO operator or list owner who
sends prospects to Reylix offers and is paid a commission on qualified, approved leads.
They arrive already knowing this industry's vocabulary and want to know payout terms,
attribution rules and whether they will be paid honestly. They are served by
`/for-publishers` and `/become-a-partner`, never by the homepage's primary path.

**Never conflated.** The publisher network and the client CRM are separate systems. A
publisher must never be implied to have access to a client's customer records.

## Product Purpose

Reylix INC builds and operates industry-specific customer acquisition systems. Each system
spans five stages the business would otherwise have to assemble from separate vendors:
digital presence, lead capture, qualification, automated and AI-assisted engagement, and
conversion into a CRM with follow-up and booking.

Success is a business that receives qualified, contacted, booked prospects — not a
dashboard of clicks.

## Positioning

The mechanism a neighbouring product cannot truthfully copy: Reylix owns the whole span
from the first click to the booked appointment, and knows which of the two a given dollar
bought. Agencies own presence. Lead vendors own capture. CRMs own what happens after.
Nobody owns the gaps between them, and the gaps are where demand is lost.

Built per industry, not per template: real estate qualification is a timeline and a
financing position; legal qualification is a case type and a jurisdiction. The same form
cannot do both.

## Operating Context

Five industry systems are live as products: Real Estate (where the system started), Home
Services, Legal, Insurance, Healthcare. Each is defined in
`components/marketing/content.ts` with its own capability set — that file is the single
source of truth for the industry list and must stay that way.

The commercial motion has two sides. Clients contract Reylix for an acquisition system.
Publishers apply, are approved or rejected, receive tracked referral links, and earn a
commission per qualified lead that is attributed, approved and paid through a lifecycle
(payable, processing, paid, void, clawed back).

## Capabilities and Constraints

- Next.js 14 App Router, TypeScript strict, Tailwind, Vitest. The marketing site lives in
  `app/(marketing)`; it deliberately does not import from `src/`.
- Two public forms, both real and working: `/contact` and `/become-a-partner`. Both post to
  live API routes with honeypots and stored consent text. **Design must not alter their
  behaviour, field names, validation or endpoints.**
- The consent wording shown beside a checkbox is stored verbatim with the submission. The
  displayed text and the stored text must never drift apart.
- Currency USD, locale en-US.
- The publisher portal and the Supabase/auth infrastructure are **on hold**. No Supabase
  project exists; no migration has been executed. The public site must not promise a portal
  as if it were available today.
- **Undecided, and not to be invented:** the production domain (`NEXT_PUBLIC_SITE_URL` is a
  placeholder), a publishable contact email, a business address or city, and the state of
  incorporation.

## Brand Commitments

- Legal name **Reylix INC**. The footer may say "A United States C Corporation" — the state
  is unconfirmed and must not be named.
- **Terminology is fixed.** *Client* = the business that hires Reylix. *Publisher* = the
  traffic partner. *Customer* or *prospect* = the end consumer. Never "partner" for a
  client, never "lead" for a person the client will speak to.
- Voice: plain, specific, unhurried. States what the system does and what it does not do.
  No hype vocabulary, no growth-hacking register, no exclamation.
- The existing SVG logo mark (`components/ui/Logo.tsx`) is the only confirmed visual asset.
- Industries are never labelled "Planned", "In Development" or "Coming Soon". All five are
  presented as operating.

## Evidence on Hand

- **Real:** the five industry capability lists; the five-stage system description; the two
  working forms; the publisher commission model; the logo mark. A real client acquisition
  system built by Reylix exists and is the intended proof on the site — **its URL and
  screenshots have not yet been supplied, and the design reserves a slot for it.**
- **Absent, and forbidden to fabricate:** testimonials, named clients, client logos,
  revenue, lead counts, conversion rates, response times, case studies, awards,
  partnerships, certifications, team photographs, headcount, founding date, and any
  guarantee of results.

A page that needs a number Reylix does not have is a page whose structure is wrong.

## Product Principles

1. **Prove with the mechanism, not with claims.** Where a competitor would put a metric,
   Reylix shows how the system works. This is a constraint that must produce better
   structure, not thinner pages.
2. **The industry is the product.** Generic acquisition advice is the thing Reylix exists
   to replace; every surface should be specific enough that a contractor and a paralegal
   read different sentences.
3. **Two audiences, one wall between them.** Client material and publisher material stay
   visibly separate. Blurring them is both a trust failure and a compliance one.
4. **Say what is not there.** Undecided facts stay undecided in public. No placeholder that
   could be mistaken for a commitment.

## Accessibility & Inclusion

WCAG 2.1 AA as the floor: 4.5:1 for body text, 3:1 for large text and controls, visible
keyboard focus, and no functional text below 11px. Clients read this site on phones in
vehicles and on job sites; legibility under bad conditions is a product requirement, not a
compliance checkbox.
