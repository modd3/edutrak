# ADR 0001: Tenant Isolation and Subscription Foundation

- **Date:** 2026-05-10
- **Status:** Accepted
- **Owners:** Platform Architecture Team

## Context
EduTrak is evolving from a feature-rich multi-school application into a production-grade SaaS platform. The next stage requires consistent tenant isolation, subscription lifecycle control, per-school customization, and template-driven document generation.

Without a single architecture decision record, implementation can drift into inconsistent `schoolId` usage, fragmented entitlement checks, and uneven operational controls.

## Decision
We will implement the platform upgrade with these architectural defaults:

1. **Hard multi-tenancy by `schoolId`**
   - All tenant-owned entities include `schoolId`.
   - Every read/write query is scoped by `schoolId` unless explicit `SUPER_ADMIN` context is present.
   - High-cardinality tables use composite indexes beginning with `schoolId`.

2. **Centralized subscription and entitlement layer**
   - Introduce core billing entities: `Plan`, `PlanFeature`, `TenantSubscription`, `BillingAccount`, `BillingInvoice`, `BillingPayment`, and `UsageMetric`.
   - Expose entitlement checks through a single service:
     - `canUseFeature(schoolId, featureKey)`
     - `withinQuota(schoolId, metricKey, requestedUnits)`
   - Route/API and background jobs must use these checks rather than inlining plan logic.

3. **Tenant configuration for runtime branding**
   - Add `SchoolBrandingConfig` with logo, colors, typography, and display metadata.
   - Frontend loads branding on session bootstrap and applies CSS tokens with safe defaults.

4. **Template-based document generation**
   - Add tenant-owned templates with scoped types and version history.
   - Use HTML-to-PDF rendering and persist immutable generated documents for audit trails.

5. **Operational and compliance baseline**
   - Expand audit events for sensitive CUD/export/print actions.
   - Add tenant-isolation tests and entitlement tests as release gates.

## Consequences

### Positive
- Reduces cross-tenant leakage risk through explicit and testable boundaries.
- Establishes a monetization-ready architecture with clean entitlement enforcement.
- Enables controlled school-level white-labeling and branded print artifacts.
- Improves auditability and incident response readiness.

### Trade-offs
- Requires migration effort across existing services to normalize query scoping.
- Adds complexity in middleware/service orchestration for entitlements.
- Introduces new maintenance surface for template and branding governance.

## Rollout Notes
- Start with fee-related modules as pilot for entitlement checks and document templates.
- Enforce PR checklist controls for all new modules before merge.
- Revisit PostgreSQL RLS as a phase-2 defense-in-depth measure after app-layer scope maturity.
