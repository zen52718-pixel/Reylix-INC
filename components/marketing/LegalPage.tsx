import { Container } from '@/components/marketing/primitives';

const YEAR = new Date().getFullYear();

/**
 * Shared shell for the two legal pages: a single 720px column of H2 + paragraph sections.
 * Both pages have identical structure, so it lives in one place and cannot drift.
 */
export function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: readonly [string, string][];
}) {
  return (
    <section className="section bg-white pt-[72px]">
      <Container className="max-w-[720px]">
        <h1 className="text-[clamp(30px,4.5vw,44px)] leading-[1.1]">{title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated {YEAR}</p>

        <div className="mt-10 flex flex-col gap-8">
          {sections.map(([heading, body]) => (
            <div key={heading}>
              <h2 className="text-[19px]">{heading}</h2>
              <p className="mt-2.5 text-base leading-[1.7]">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
