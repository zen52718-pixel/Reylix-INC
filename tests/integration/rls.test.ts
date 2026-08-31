/**
 * DATABASE-LEVEL RLS VERIFICATION.
 *
 * This suite does not inspect SQL — it opens real connections with the anon key, signs in
 * as two different publishers, and asserts what each one can actually read and write. It
 * is the difference between RLS being *intended* and RLS being *enforced*.
 *
 * ── Requirements ────────────────────────────────────────────────────────────────
 * Point this at a DISPOSABLE Supabase project. It writes real rows.
 *
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RLS_TEST_A_EMAIL / RLS_TEST_A_PASSWORD    auth user linked to publisher A
 *   RLS_TEST_B_EMAIL / RLS_TEST_B_PASSWORD    auth user linked to publisher B
 *   RUN_SUPABASE_RLS=1
 *
 * Both auth users must already exist (Authentication → Users → Invite) and each must be
 * linked to an ACTIVE publisher row via `auth_user_id`. See docs/supabase-setup.md §1.6.
 *
 * Skipped entirely when unconfigured, so it never blocks a local run.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const A_EMAIL = process.env.RLS_TEST_A_EMAIL;
const A_PASSWORD = process.env.RLS_TEST_A_PASSWORD;
const B_EMAIL = process.env.RLS_TEST_B_EMAIL;
const B_PASSWORD = process.env.RLS_TEST_B_PASSWORD;

const configured =
  process.env.RUN_SUPABASE_RLS === '1' &&
  Boolean(URL && ANON && SERVICE && A_EMAIL && A_PASSWORD && B_EMAIL && B_PASSWORD);

/** A client that has signed in as a real publisher. Every query runs under RLS. */
async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(URL as string, ANON as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`RLS setup: could not sign in as ${email} — ${error.message}`);
  return client;
}

describe.skipIf(!configured)('RLS · database-level enforcement', () => {
  let admin: SupabaseClient;
  let anon: SupabaseClient;
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  let publisherA: string;
  let publisherB: string;
  let leadB: string;
  let commissionB: string;
  let linkB: string;
  let clientRowId: string;

  const tag = Date.now().toString(36).toUpperCase().slice(-6);

  beforeAll(async () => {
    admin = createClient(URL as string, SERVICE as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    anon = createClient(URL as string, ANON as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    clientA = await signedInClient(A_EMAIL as string, A_PASSWORD as string);
    clientB = await signedInClient(B_EMAIL as string, B_PASSWORD as string);

    // Resolve both publishers through the service-role client.
    const { data: pubs } = await admin
      .from('publishers')
      .select('id, email, status')
      .in('email', [A_EMAIL as string, B_EMAIL as string]);
    const rowA = pubs?.find((p) => p.email === A_EMAIL);
    const rowB = pubs?.find((p) => p.email === B_EMAIL);
    if (!rowA || !rowB) {
      throw new Error('RLS setup: both test publishers must exist and be linked to auth users');
    }
    if (rowA.status !== 'active' || rowB.status !== 'active') {
      throw new Error('RLS setup: both test publishers must be ACTIVE');
    }
    publisherA = rowA.id;
    publisherB = rowB.id;

    // Seed a client → offer → lead → commission chain owned by publisher B.
    const { data: c } = await admin
      .from('clients')
      .insert({
        company: `RLS Client ${tag}`,
        contact_name: 'RLS',
        contact_email: `rls-${tag}@example.com`,
        status: 'active',
      })
      .select('id')
      .single();
    clientRowId = c!.id;

    const { data: o } = await admin
      .from('offers')
      .insert({
        client_id: clientRowId,
        offer_code: `RLS${tag}`,
        name: 'RLS Offer',
        destination_url: 'https://example.com',
        commission_model: 'flat',
        commission_amount: 100,
        currency: 'USD',
        is_active: true,
      })
      .select('id')
      .single();

    const { data: l } = await admin
      .from('leads')
      .insert({
        publisher_id: publisherB,
        offer_id: o!.id,
        client_id: clientRowId,
        status: 'approved',
        captured_data: { name: 'RLS Consumer' },
        approved_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    leadB = l!.id;

    const { data: link } = await admin
      .from('referral_links')
      .insert({ publisher_id: publisherB, offer_id: o!.id, ref_code: `RLSB-${tag}` })
      .select('id')
      .single();
    linkB = link!.id;

    const { data: com } = await admin
      .from('commissions')
      .insert({
        lead_id: leadB,
        publisher_id: publisherB,
        offer_id: o!.id,
        client_id: clientRowId,
        amount: 100,
        currency: 'USD',
        model: 'flat',
        status: 'payable',
      })
      .select('id')
      .single();
    commissionB = com!.id;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    await admin.from('commissions').delete().eq('id', commissionB);
    await admin.from('referral_links').delete().eq('id', linkB);
    await admin.from('leads').delete().eq('id', leadB);
    await admin.from('offers').delete().eq('offer_code', `RLS${tag}`);
    await admin.from('clients').delete().eq('id', clientRowId);
  }, 60_000);

  it('publisher A cannot READ publisher B leads', async () => {
    const { data } = await clientA.from('leads').select('id').eq('id', leadB);
    expect(data ?? []).toHaveLength(0);
  });

  it('publisher A cannot MODIFY publisher B leads', async () => {
    await clientA.from('leads').update({ status: 'rejected', reject_reason: 'hijack' }).eq('id', leadB);
    // Verified with the service-role client — the row must be untouched.
    const { data } = await admin.from('leads').select('status').eq('id', leadB).single();
    expect(data?.status).toBe('approved');
  });

  it('publisher A cannot DELETE publisher B leads', async () => {
    await clientA.from('leads').delete().eq('id', leadB);
    const { data } = await admin.from('leads').select('id').eq('id', leadB);
    expect(data ?? []).toHaveLength(1);
  });

  it('publisher A cannot read publisher B referral links', async () => {
    const { data } = await clientA.from('referral_links').select('id').eq('id', linkB);
    expect(data ?? []).toHaveLength(0);
  });

  it('publisher A cannot read publisher B commissions', async () => {
    const { data } = await clientA.from('commissions').select('id').eq('id', commissionB);
    expect(data ?? []).toHaveLength(0);
  });

  it('publisher A cannot WRITE a commission for themselves', async () => {
    // The worst failure this schema could have: a publisher paying themselves.
    const { error } = await clientA.from('commissions').insert({
      lead_id: leadB,
      publisher_id: publisherA,
      offer_id: '00000000-0000-0000-0000-000000000000',
      client_id: clientRowId,
      amount: 999999,
      currency: 'USD',
      model: 'flat',
      status: 'payable',
    });
    expect(error).not.toBeNull();
  });

  it('publisher B CAN read their own lead, link and commission', async () => {
    const lead = await clientB.from('leads').select('id').eq('id', leadB);
    const link = await clientB.from('referral_links').select('id').eq('id', linkB);
    const com = await clientB.from('commissions').select('id').eq('id', commissionB);
    expect(lead.data ?? []).toHaveLength(1);
    expect(link.data ?? []).toHaveLength(1);
    expect(com.data ?? []).toHaveLength(1);
  });

  it('no publisher can read the clients table', async () => {
    const a = await clientA.from('clients').select('company');
    const b = await clientB.from('clients').select('company');
    // Client identity is protected at the database, not merely omitted by the UI.
    expect(a.data ?? []).toHaveLength(0);
    expect(b.data ?? []).toHaveLength(0);
  });

  it('an unauthenticated client can read nothing', async () => {
    for (const table of ['leads', 'commissions', 'referral_links', 'clients', 'publishers']) {
      const { data } = await anon.from(table).select('id');
      expect(data ?? []).toHaveLength(0);
    }
  });

  it('the service-role client still sees everything', async () => {
    // Route A depends on this: the application bypasses RLS by design, which is exactly
    // why service-layer scoping is mandatory rather than optional.
    const { data } = await admin.from('leads').select('id').eq('id', leadB);
    expect(data ?? []).toHaveLength(1);
  });

  it('current_publisher_id() resolves to the signed-in publisher and excludes non-active', async () => {
    const { data: forB } = await clientB.rpc('current_publisher_id');
    expect(forB).toBe(publisherB);

    // Suspending B must immediately close every policy that depends on the function.
    await admin.from('publishers').update({ status: 'suspended' }).eq('id', publisherB);
    const { data: afterSuspend } = await clientB.from('leads').select('id').eq('id', leadB);
    expect(afterSuspend ?? []).toHaveLength(0);

    await admin.from('publishers').update({ status: 'active' }).eq('id', publisherB);
  }, 30_000);
});

describe.skipIf(configured)('RLS · not configured', () => {
  it('is skipped until a Supabase project exists', () => {
    // Present so a run without credentials reports the gap rather than silently passing.
    expect(configured).toBe(false);
  });
});
