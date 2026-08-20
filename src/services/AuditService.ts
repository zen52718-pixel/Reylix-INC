/**
 * AuditService (Blueprint Sprint 5) — append-only trail of privileged actions (§3, §4.3).
 * Every admin mutation calls `log(...)`. Storage-agnostic.
 */
import type { AuditEntry } from '@/src/domain/types';
import type { AuditRepo } from '@/src/repositories/interfaces';

export class AuditService {
  constructor(private readonly audit: AuditRepo) {}

  async log(
    actor: string,
    entity: string,
    entityId: string,
    action: string,
    detail: Record<string, unknown> = {},
  ): Promise<void> {
    await this.audit.append({
      actor,
      entity,
      entityId,
      action,
      detail,
      occurredAt: new Date().toISOString(),
    });
  }

  list(filter?: Partial<AuditEntry>): Promise<AuditEntry[]> {
    return this.audit.list(filter);
  }
}
