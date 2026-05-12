# EduTrak SaaS Upgrade Milestones

**Date:** 2026-05-10  
**Scope:** Incremental implementation plan for full multi-tenant SaaS readiness.

## Milestone 1 — Foundation Schema (Current PR)
- [x] Add subscription/billing core models:
  - `Plan`, `PlanFeature`, `TenantSubscription`
  - `BillingAccount`, `BillingInvoice`, `BillingPayment`
  - `UsageMetric`
- [x] Add school customization model:
  - `SchoolBrandingConfig`
- [x] Add print template core models:
  - `DocumentTemplate`, `TemplateVersion`
- [x] Add required enums for lifecycle/status and template scopes.

### Exit Criteria
- Prisma schema compiles and includes all baseline relationships.
- Tenant-owned tables include `schoolId` and indexing for scoped queries.

## Milestone 2 — Subscription Runtime Guards
- [x] Create entitlement service (`canUseFeature`, `withinQuota`).
- [x] Add middleware-level feature gate for protected routes.
- [x] Integrate in fees module as pilot.
- [x] Add tests for ACTIVE/TRIALING/GRACE/SUSPENDED behavior.

## Milestone 3 — Billing Operations
- [x] Add subscription CRUD and state transitions.
- [x] Add billing account APIs.
- [x] Add invoice/payment APIs and retry/dunning status transitions.
- [x] Add admin billing UI pages (super-admin and school-admin).

## Milestone 4 — Tenant Branding Runtime
- [ ] Add branding config API.
- [ ] Load branding on auth bootstrap.
- [ ] Apply CSS variables with accessibility validation.
- [ ] Add safe default/fallback theme behavior.

## Milestone 5 — Template + PDF Pipeline
- [ ] Add template CRUD + versioning + publish workflow.
- [ ] Implement preview endpoint with sample data.
- [ ] Build HTML-to-PDF generation service.
- [ ] Pilot with `FEE_INVOICE` and `PAYMENT_RECEIPT` outputs.

## Milestone 6 — Governance & Hardening
- [ ] Expand audit events for C/U/D/export/print.
- [ ] Add tenant isolation regression test suite.
- [ ] Add telemetry for feature usage and quota consumption.
- [ ] Add runbooks for rollback and incident response.

## PR Checklist Carry-Forward (Mandatory)
For every new module or major extension:
1. Confirm `schoolId` ownership/scoping.
2. Add entitlement key + plan mapping.
3. Decide print-template support requirements.
4. Add audit events.
5. Add tenant-isolation tests.
