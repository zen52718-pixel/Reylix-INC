# Design

The Reylix visual world is **Visible Record**: the graphic language of mid-century American
visible-record office systems — signal tabs clipped to a card's edge, edge-visible rails,
steel files, and the catalogs that sold them.

This is not a theme. It is chosen because Reylix sells a record system, and because signal
tabs are a real, non-decorative state vocabulary: a colour on an edge has always meant one
specific thing. That lets the site encode stage, status and industry **without inventing a
single metric** — which matters, because Reylix has no metrics, testimonials or case studies
to publish and must never fabricate them.

Recorded from the built site, not from intention. Source of truth for tokens is
`tailwind.config.ts`; for the vocabulary, `components/marketing/primitives.tsx`.

---

## Ground and material

The page is a file drawer. Content sits on buff card stock; the steel cabinet shows between
the cards. Two planes, never more.

| Role | Token | Value |
|---|---|---|
| Cabinet, page ground | `steel-800` | `#2e3836` |
| Cabinet, alternate band | `steel-900` | `#232b2a` |
| Cabinet, deepest (footer, closing CTA) | `steel-950` | `#171c1c` |
| Record card stock | `card` | `#f4f2ec` |
| Card rule (between fields) | `card-rule` | `#d3cec0` |
| Card top edge | `card-edge` | `#c2bcaa` |

`steel` is green-biased, not neutral. Secondary text on the cabinet is tinted from that
hue (`steel-200` / `steel-300`) rather than set in generic gray — the craft floor's rule for
text on a coloured surface.

Light or dark was picked from the use scene, not from category habit: these visitors read
this site in a truck cab at the end of a day and at a desk between jobs. The cabinet is dark
and the cards they actually read are light.

## Signal codes

Five tab colours. Each is a **code with a fixed meaning**, used identically on every page.
Never an accent scattered for warmth.

| Code | On card | On steel (`-up`) | Meaning |
|---|---|---|---|
| orange | `#b83f16` | `#ef8b5a` | Primary action, active state, Real Estate |
| green | `#186252` | `#5cbfa4` | Complete / confirmed, Insurance |
| blue | `#234f74` | `#87b6e0` | Legal |
| amber | `#8f6410` | `#e3b053` | Home Services |
| plum | `#6d2c47` | `#d691ad` | **The publisher network**, Healthcare |

The `-up` values exist because the deep plastics sink into the cabinet and fall under the 3:1
a rule needs to read as a signal. Same code, two grounds — never two different codes.

**Plum carries the publisher side of the business everywhere it appears.** `/for-publishers`
and `/become-a-partner` are plum from the page header through to the closing CTA. That is a
compliance boundary made visible: a client must never mistake publisher material for their
own, and the colour is the fastest way to say so.

Text roles on card stock: `ink` `#1a1f1d`, `ink-soft` `#4a534e`, `ink-faint` `#5c655e`.
`ink-faint` was darkened from `#5c655e`'s predecessor specifically to clear 4.5:1.

## Type

Two faces, two jobs.

- **Saira Condensed** (`--font-gothic`) — every piece of engineered lettering: signal tabs,
  reference datums, navigation, headings, and the display. Condensed because a tab is narrow
  and the caps have to fit it.
- **Public Sans** (`--font-text`) — everything read as a fact. A workhorse built for public
  records, legible on a phone in bad light.

Both self-hosted at build time by `next/font`, so no request leaves the visitor's browser.

| Role | Size | Notes |
|---|---|---|
| Display (h1, homepage) | `clamp(3rem, 9vw, 6rem)` | uppercase, `leading-[0.86]`, tracking `-0.025em` |
| Page h1 (interior) | `clamp(2.25rem, 5vw, 3.5rem)` | capped at 56px — a long sentence at 76px owned the whole viewport |
| Section h2 | `text-3xl` / `sm:text-4xl` | uppercase, `max-w-[22ch]` |
| Body | `1rem` / 1.6 | measure capped at `68ch` |
| Fine | `0.8125rem` (13px) | card field text |
| Tab and datum | `0.75rem` (12px) | tracking `0.09em` |

**12px is the hard floor for anything functional.** The previous site set its `.label` at
10.88px in 54 places. Nothing ships below 12px.

## Composition rules

1. **No kicker, ever.** A reference datum is set at the **end of its heading's line**,
   catalog-style — title left, catalogue number right, one rule across the top. It is never a
   small tracked label stacked above a heading. That stacked label appeared on every section
   of every page before this rewrite and is banned outright.
2. **Fixed line pitch.** A ruled form's lines sit the same distance apart whether the entry
   runs to one line or two, and rules must align across columns (`min-h-[3.5rem]`).
3. **No card grids as page structure.** Lists of equal icon-and-heading cards were replaced by
   `Manifest` — one ruled, numbered line per item, at catalogue density.
4. **Full-width record rows for the industries.** Five industries in a two-column grid used to
   leave a hole; rows cannot have one at any count.
5. **Rhythm.** Bands alternate `steel-800` / `steel-900`, with `steel-950` reserved for the
   footer and the closing action, so a dense passage is followed by a quiet one.
6. **Numbers earn their place.** `01`–`05` on the stages are real sequence information — a
   prospect moves through them in order. Section numbers as decoration are refused.

## Vocabulary

Defined in `components/marketing/primitives.tsx`:

- `SignalTab` — the clipped plastic tab, notched on its lower-left via `clip-path`.
- `RecordCard` — buff card, tabs as a separate row above so they push content down instead
  of overlapping the first line at any width. `raised` for the top card of a file.
- `SectionHead` / `PageHeader` — heading plus end-of-line datum plus signal rule.
- `Manifest` — the numbered ruled list.
- `Stages` — the five-stage file, every tab visible at once.
- `PullTab` — the primary action. Notched, and it slides 6px out of the file on hover.
- `GhostTab` — the secondary action. Outlined, never a second filled tab.
- `Field`, `Prose`, `Section`, `CallToAction`.

## Depth and motion

Shadows carry a real offset and a soft blur (`shadow-pull`, `shadow-rest`) — never a
zero-offset coloured halo.

One authored moment: `.seat`, cards settling into the file on first paint, staggered 60–70ms
along a rail, easing `cubic-bezier(0.16, 1, 0.3, 1)`. It animates **from an already-visible
default** (opacity 0.55, not 0), so nothing is hidden if the animation never runs. Hover
motion is reserved for the pull tab alone. `prefers-reduced-motion` collapses all of it.

## Browser surfaces

Themed from the palette in `app/globals.css`, because the parts nobody draws still carry the
design: text selection, the caret, the focus ring, scrollbar track and thumb, underline
offset, and tabular figures on `time`, `data`, `th`, `td` and `.datum`.

## Verification

`.claude/skills/impeccable/scripts/impeccable detect` against a production build, all nine
routes, at 1280 and 390×844: **zero findings**. The same site before this work: 134.

Mobile was verified live at 375px and 390px — `scrollWidth === clientWidth`, zero overflowing
elements. Headless Chrome on this machine clamps its minimum layout width and cannot produce
a valid mobile screenshot; do not trust one produced that way.

## Open

- The homepage reserves a slot for **one real client system**. Until its URL and screenshots
  exist, that section is absent rather than filled with placeholder proof.
- Production domain, contact email, city and state of incorporation remain undecided and are
  not stated anywhere on the site.
