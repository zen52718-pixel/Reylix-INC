/**
 * Composition root for services. The ONLY place services are bound to the configured
 * storage backend (via the repository factory) and to environment-derived config.
 * Route handlers call `getServices()`; tests construct the service classes directly with
 * memory repos for isolation.
 */
import { allowedRedirectHosts, loadEnv, redirectBaseUrl } from '@/src/config/env';
import { getRepositories } from '@/src/repositories';
import { AttributionService } from '@/src/services/AttributionService';
import { AuditService } from '@/src/services/AuditService';
import { CampaignService } from '@/src/services/CampaignService';
import { ClientService } from '@/src/services/ClientService';
import { CommissionService } from '@/src/services/CommissionService';
import { InquiryService } from '@/src/services/InquiryService';
import { LeadService } from '@/src/services/LeadService';
import { mailNotifierConfig } from '@/src/lib/mail-setup';
import { EmailAdminNotifier } from '@/src/services/email-notifier';
import { LoggingAdminNotifier } from '@/src/services/notifications';
import { OfferService } from '@/src/services/OfferService';
import { PayoutService } from '@/src/services/PayoutService';
import { ProductService } from '@/src/services/ProductService';
import { PublisherPortalService } from '@/src/services/PublisherPortalService';
import { PublisherService } from '@/src/services/PublisherService';

export interface Services {
  clients: ClientService;
  products: ProductService;
  campaigns: CampaignService;
  publishers: PublisherService;
  offers: OfferService;
  attribution: AttributionService;
  leads: LeadService;
  portal: PublisherPortalService;
  audit: AuditService;
  commission: CommissionService;
  payouts: PayoutService;
  inquiries: InquiryService;
}

let services: Services | null = null;

export function getServices(): Services {
  if (!services) {
    const repos = getRepositories();
    const env = loadEnv();
    /**
     * With no durable store configured, the admin notification is the only copy of a
     * submission that outlives the request — so a real notifier is used the moment one is
     * fully configured, and the logging one remains the fallback.
     */
    const emailConfig = mailNotifierConfig(env);
    const notifier = emailConfig ? new EmailAdminNotifier(emailConfig) : new LoggingAdminNotifier();
    const audit = new AuditService(repos.audit);
    const attribution = new AttributionService(
      {
        publishers: repos.publishers,
        offers: repos.offers,
        clicks: repos.clicks,
        leadAttributions: repos.leadAttributions,
        leads: repos.leads,
      },
      {
        dedupMinutes: env.CLICK_DEDUP_MINUTES,
        allowedRedirectHosts: allowedRedirectHosts(),
      },
    );
    services = {
      clients: new ClientService(repos.clients, audit),
      products: new ProductService(repos.products, audit),
      campaigns: new CampaignService(repos.campaigns, repos.products, audit),
      publishers: new PublisherService(repos.publishers, audit),
      offers: new OfferService(repos.offers, repos.campaigns, repos.clients, repos.products),
      attribution,
      leads: new LeadService({
        leads: repos.leads,
        offers: repos.offers,
        campaigns: repos.campaigns,
        attribution,
        notifier,
      }),
      portal: new PublisherPortalService(
        {
          publishers: repos.publishers,
          offers: repos.offers,
          leads: repos.leads,
          clicks: repos.clicks,
          referralLinks: repos.referralLinks,
          commissions: repos.commissions,
        },
        { redirectBaseUrl: redirectBaseUrl() },
      ),
      audit,
      commission: new CommissionService(
        repos.leads,
        repos.offers,
        repos.commissions,
        repos.leadAttributions,
        audit,
      ),
      payouts: new PayoutService(repos.leads, repos.payouts, repos.commissions, audit),
      inquiries: new InquiryService(repos.inquiries, notifier),
    };
  }
  return services;
}

/** Test-only: clear the cached services singleton. */
export function __resetServices(): void {
  services = null;
}

export { ClientService } from '@/src/services/ClientService';
export { ProductService } from '@/src/services/ProductService';
export { CampaignService } from '@/src/services/CampaignService';
export { PublisherService } from '@/src/services/PublisherService';
export { OfferService } from '@/src/services/OfferService';
export { AttributionService } from '@/src/services/AttributionService';
export { LeadService } from '@/src/services/LeadService';
export { PublisherPortalService } from '@/src/services/PublisherPortalService';
export { AuditService } from '@/src/services/AuditService';
export { CommissionService } from '@/src/services/CommissionService';
export { PayoutService } from '@/src/services/PayoutService';
export { InquiryService } from '@/src/services/InquiryService';
