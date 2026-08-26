import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import { AuditService } from '@/src/services/AuditService';
import { CommissionService } from '@/src/services/CommissionService';
import { seedAttributedLead, seedChain, type SeededChain } from '@/tests/support/fixtures';

function build(chain: SeededChain) {
  const audit = new AuditService(chain.repos.audit);
  return new CommissionService(
    chain.repos.leads,
    chain.repos.offers,
    chain.repos.commissions,
    chain.repos.leadAttributions,
    audit,
  );
}

describe('CommissionService', () => {
  let chain: SeededChain;
  let service: CommissionService;

  beforeEach(async () => {
    chain = await seedChain({ commissionAmount: 5000 });
    service = build(chain);
  });

  it('creates a commission record at approval, priced from the offer by default', async () => {
    const { lead } = await seedAttributedLead(chain);

    const { lead: approved, commission } = await service.approve(lead.id, 'admin@reylix.com');

    expect(approved.status).toBe('approved');
    expect(approved.approvedAt).toBeTruthy();
    expect(commission).not.toBeNull();
    expect(commission?.amount).toBe(5000);
    expect(commission?.status).toBe('payable');
    expect(commission?.publisherId).toBe(chain.publisherId);
    expect(commission?.clientId).toBe(chain.clientId);
  });

  it('locks the admin-entered amount rather than the offer amount', async () => {
    const { lead } = await seedAttributedLead(chain);
    const { commission } = await service.approve(lead.id, 'admin@reylix.com', 7250);
    expect(commission?.amount).toBe(7250);

    // A later change to the offer must not alter what has already been earned.
    await chain.repos.offers.update(chain.offerId, { commissionAmount: 1 });
    expect((await service.getForLead(lead.id))?.amount).toBe(7250);
  });

  it('approves an UNATTRIBUTED lead but creates no commission', async () => {
    const lead = await chain.repos.leads.append({
      publisherId: null,
      offerId: chain.offerId,
      clientId: chain.clientId,
      productId: chain.productId,
      campaignId: chain.campaignId,
      refCode: null,
      status: 'new',
      capturedData: {},
      createdAt: new Date().toISOString(),
    });

    const { lead: approved, commission } = await service.approve(lead.id, 'admin@reylix.com');
    expect(approved.status).toBe('approved');
    // The client still wants the lead; there is simply nobody to pay for it.
    expect(commission).toBeNull();
  });

  it('refuses to guess a price for a non-flat commission model', async () => {
    const cpa = await seedChain({ commissionModel: 'cpa', commissionAmount: 5000 });
    const cpaService = build(cpa);
    const { lead } = await seedAttributedLead(cpa);

    await expect(cpaService.approve(lead.id, 'admin@reylix.com')).rejects.toBeInstanceOf(
      ValidationError,
    );
    // An explicit amount is accepted.
    const { commission } = await cpaService.approve(lead.id, 'admin@reylix.com', 1234);
    expect(commission?.amount).toBe(1234);
    expect(commission?.model).toBe('cpa');
  });

  it('rejects with a required reason and creates no commission', async () => {
    const { lead } = await seedAttributedLead(chain);

    await expect(service.reject(lead.id, 'admin@reylix.com', '  ')).rejects.toBeInstanceOf(
      ValidationError,
    );

    const rejected = await service.reject(lead.id, 'admin@reylix.com', 'Wrong service area');
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectReason).toBe('Wrong service area');
    expect(await service.getForLead(lead.id)).toBeNull();
  });

  it('refuses illegal transitions', async () => {
    const { lead } = await seedAttributedLead(chain);
    await service.reject(lead.id, 'admin@reylix.com', 'no');
    await expect(service.approve(lead.id, 'admin@reylix.com')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('voids an unpaid commission and claws back a paid one', async () => {
    const { lead } = await seedAttributedLead(chain);
    const { commission } = await service.approve(lead.id, 'admin@reylix.com');

    const voided = await service.voidCommission(lead.id, 'admin@reylix.com', 'client reversed');
    expect(voided.status).toBe('void');
    expect(voided.voidReason).toBe('client reversed');
    expect(await service.getForLead(lead.id)).toBeNull();

    // Now the paid case, on a second lead.
    const second = await seedAttributedLead(chain);
    const approved = await service.approve(second.lead.id, 'admin@reylix.com');
    await chain.repos.commissions.update(approved.commission!.id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
    });

    const clawed = await service.voidCommission(second.lead.id, 'admin@reylix.com', 'fraud');
    // Money already sent is reclaimed visibly, never deleted quietly.
    expect(clawed.status).toBe('clawed_back');
    expect(commission?.id).not.toBe(clawed.id);
  });

  it('requires a reason to void', async () => {
    const { lead } = await seedAttributedLead(chain);
    await service.approve(lead.id, 'admin@reylix.com');
    await expect(service.voidCommission(lead.id, 'admin@reylix.com', ' ')).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('raises NotFound when voiding a lead with no live commission', async () => {
    const { lead } = await seedAttributedLead(chain);
    await expect(service.voidCommission(lead.id, 'admin@reylix.com', 'x')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('writes an audit row for every approval', async () => {
    const { lead } = await seedAttributedLead(chain);
    await service.approve(lead.id, 'admin@reylix.com');
    const entries = await chain.repos.audit.list({ entityId: lead.id });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe('approved');
  });
});
