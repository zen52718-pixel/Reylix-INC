/**
 * Foundation placeholder. The real marketing site is Sprint 4; this page exists so the
 * app builds and deploys from Sprint 0 onward, and so the health of a deployment can be
 * confirmed in a browser rather than only through /api/healthz.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Reylix INC</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-brand-900 sm:text-5xl">
        US customer acquisition, built on owned products.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
        We build and own the products, and run a publisher channel that connects US
        advertisers with the customers they are looking for.
      </p>
      <div className="mt-10 rounded-xl border border-[color:var(--border)] bg-brand-50 p-5">
        <p className="text-sm font-medium text-brand-800">Platform in development</p>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          The publisher portal, admin operations console, and public site are being built in
          sequence. This page is the deployment placeholder.
        </p>
      </div>
    </main>
  );
}
