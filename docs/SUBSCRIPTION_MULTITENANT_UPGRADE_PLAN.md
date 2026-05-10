# EduTrak Upgrade Instruction Plan
## Subscription, Multi-Tenancy, School Customization, and Printouts

**Date:** 2026-05-10  
**Repository:** `edutrak`  
**Purpose:** Define an implementation-ready, industry-standard roadmap to evolve EduTrak into a production-grade, subscription-based multi-tenant school management platform with per-school UI/branding and printout customization.

---

## 1) Current State Snapshot (from repo review)

The app already has strong foundational modules (auth, users, students, classes, subjects, assessments, reports, fees) and role-aware routing/navigation. Fee workflows are actively being wired end-to-end. The platform appears school-aware in many flows, but does not yet expose complete SaaS controls required for:

- commercial subscription lifecycle,
- strict tenant isolation and governance,
- per-school theming/white-labeling,
- configurable print templates,
- enterprise-grade audit/compliance operations.

This plan closes those gaps.

---

## 2) Target Product Standards (Industry Baseline)

A modern school-management SaaS should include:

1. **True multi-tenancy** with hard data isolation.
2. **Subscription billing** (trial, paid plans, grace, suspension, cancellation, dunning).
3. **Tenant configuration layer** (branding, locale, academic preferences, feature flags).
4. **Document engine** for printable artifacts (report cards, invoices, receipts, transcripts, ID cards, certificates).
5. **Operational controls** (audit logs, backups, observability, SLOs, incident readiness).
6. **Compliance and privacy** (FERPA/GDPR-style controls where applicable).

---

## 3) High-Level Gaps and Upgrade Workstreams

### Workstream A — Multi-Tenant Architecture Hardening
- Standardize tenant identifier (`schoolId`) across all entities and queries.
- Enforce tenant scoping at middleware + service + DB layers.
- Add tenancy safety tests to prevent cross-tenant data access regressions.

### Workstream B — Subscription & Billing Platform
- Introduce plans, entitlements, billing accounts, invoices, payments, and subscription status state machine.
- Gate features by entitlements (module-level and quota-level limits).
- Add dunning/grace period handling.

### Workstream C — School Customization (UI)
- Add school theme tokens (logo, primary/secondary colors, font, app name, favicon, email footer style).
- Runtime tenant theme loader on login/session bootstrap.
- Optional “theme presets” + advanced custom CSS variables.

### Workstream D — Printouts & Templates
- Build a template system for documents with school branding and configurable fields.
- Render HTML -> PDF pipeline for consistent cross-device printing.
- Add per-template versioning and approval workflow.

### Workstream E — Governance, Security, and Operations
- Audit trail expansion for sensitive actions.
- Rate limiting by tenant and API key/client.
- Observability dashboards and tenant-level usage telemetry.

### Workstream F — Product Completion for School Operations
- Attendance, timetable, exams calendar, communication center (SMS/email/notifications), parent portal depth, and finance reconciliation.

---

## 4) Subscription-Based SaaS Design (Concrete)

### 4.1 Core Subscription Data Model
Add these core entities:

- `Plan` (name, price, billing interval, features)
- `PlanFeature` (feature key, limit type, limit value)
- `TenantSubscription` (schoolId, planId, status, cycle dates, trial, cancelAt)
- `BillingAccount` (schoolId, legal profile, tax profile)
- `BillingInvoice` (subscription cycle charges)
- `BillingPayment` (captures, refunds, failures)
- `UsageMetric` (per-tenant counters for quotas)

### 4.2 Entitlements Engine
Implement a centralized API:
- `canUseFeature(schoolId, featureKey)`
- `withinQuota(schoolId, metricKey, requestedUnits)`

Use this in:
- middleware for route/API gating,
- frontend capability loading,
- job processors for quota-sensitive actions.

### 4.3 Subscription Lifecycle States
Support:
- `TRIALING`, `ACTIVE`, `PAST_DUE`, `GRACE`, `SUSPENDED`, `CANCELED`, `EXPIRED`.

Define behavior per state:
- read-only mode,
- blocked writes,
- blocked login for certain roles,
- emergency admin override.

---

## 5) Multi-Tenant Isolation Strategy

### 5.1 Isolation Levels
- **App layer:** Every query scoped by `schoolId` unless SUPER_ADMIN context is explicit.
- **DB layer:** composite indexes by `(schoolId, ...)` for high-cardinality tables.
- **(Optional next stage):** PostgreSQL Row-Level Security for defense in depth.

### 5.2 Safety Controls
- Add unit/integration tests for “tenant A cannot read tenant B records”.
- Add lint/check patterns to flag unscoped queries.
- Add security review checklist for each new module.

---

## 6) How Each School Gets a Custom UI

### 6.1 Theme & Branding Configuration
Create `SchoolBrandingConfig`:
- `logoUrl`, `miniLogoUrl`, `appDisplayName`, `faviconUrl`
- `primaryColor`, `secondaryColor`, `accentColor`
- `fontFamily`, `borderRadiusScale`, `density`
- `dashboardLayoutPreset` (optional)

### 6.2 Frontend Implementation Pattern
1. On login/session init, fetch tenant config.
2. Store in global state (`theme-store` or existing auth/school context).
3. Apply CSS variables at root (`:root` or scoped container).
4. Fall back to default theme safely.

### 6.3 Optional White-Label Capability
- Custom domain per tenant.
- Tenant-specific login page background, name, and legal text.

---

## 7) How Each School Gets Custom Printouts

### 7.1 Document Template Model
Add:
- `DocumentTemplate` (tenant-owned)
- `TemplateSection` (header/body/footer blocks)
- `TemplateAsset` (logos/signatures/stamps)
- `TemplateVersion` (versioned changes)

Template scopes:
- `REPORT_CARD`, `FEE_INVOICE`, `PAYMENT_RECEIPT`, `STUDENT_TRANSCRIPT`, `ADMISSION_FORM`, `LEAVING_CERTIFICATE`, `ID_CARD`.

### 7.2 Rendering Pipeline
- Render data into template (Handlebars/Nunjucks/React server templates).
- Convert to PDF (Playwright/Puppeteer).
- Store immutable generated PDFs for audit/download history.

### 7.3 Template Governance
- Draft -> Review -> Published status.
- Preview mode with sample student/invoice data.
- Rollback to previous version.

---

## 8) Missing Functional Modules to Reach Full Industry Coverage

1. **Attendance Management** (daily/class/period, parent notifications).
2. **Timetable Engine** (teacher/room conflict handling).
3. **Exam & Assessment Calendar** (cross-term planning).
4. **Communication Hub** (SMS/email/push and delivery logs).
5. **Library & Inventory** (assets, books, fees/fines).
6. **Transport & Route Management**.
7. **HR/Payroll (optional by plan tier)**.
8. **Advanced finance reconciliation and accounting exports**.

---

## 9) Implementation Phases (Recommended Execution Order)

### Phase 0 — Architecture & Controls (1–2 weeks)
- Finalize SaaS architecture decisions.
- Add tenant-isolation test harness.
- Add feature-flag framework.

### Phase 1 — Subscription Core (2–4 weeks)
- DB schema + APIs for plans/subscriptions/billing account.
- Entitlement middleware.
- Admin billing console (super admin + school admin views).

### Phase 2 — Tenant Custom UI (2–3 weeks)
- Branding config model/API/UI.
- Runtime theming with CSS tokens.
- White-label login support.

### Phase 3 — Print Template Engine (3–5 weeks)
- Template models + editor + preview.
- PDF service and document center.
- Fee and assessment printouts first.

### Phase 4 — Ops & Compliance (parallel)
- Audit coverage expansion.
- Metrics, alerts, SLO dashboards.
- Privacy controls/data retention configuration.

### Phase 5 — Feature Expansion (ongoing)
- Attendance, timetable, comms hub, etc.

---

## 10) Suggested Technical Deliverables Per Phase

For each phase, deliver:
1. **Schema migrations**
2. **Backend service + controller + route coverage**
3. **Frontend management screens**
4. **Automated tests (unit/integration/e2e)**
5. **Runbook + rollback steps**

---

## 11) KPIs to Track Upgrade Success

- Tenant isolation incident count (target: 0)
- Subscription conversion rate and churn rate
- Failed payment recovery rate
- Print template adoption per tenant
- Document generation success latency (p95)
- Feature usage by plan tier

---

## 12) Immediate Next Implementation Tasks (Actionable)

1. Add `docs/` architecture decision record for tenancy model.
2. Introduce initial billing schema migration (plan/subscription/account).
3. Add entitlement guard middleware and integrate with one module (fees) first.
4. Implement tenant branding API + frontend runtime theme application.
5. Implement `FEE_INVOICE` and `PAYMENT_RECEIPT` template + PDF generation as pilot.

---

## 13) Risks and Mitigations

- **Risk:** Entitlement checks scattered and inconsistent.  
  **Mitigation:** Centralize checks in one service + middleware wrappers.

- **Risk:** Custom print templates break layout across browsers/printers.  
  **Mitigation:** PDF-first rendering with fixed print CSS and preview regression tests.

- **Risk:** Tenant-specific theming causes UI contrast/accessibility issues.  
  **Mitigation:** Enforce WCAG contrast validation in theme editor.

---

## 14) Definition of Done for “Subscription + Multi-tenant Ready”

The platform is considered ready when:
- all critical data paths enforce tenant isolation,
- each school has an active subscription state and feature entitlements,
- UI branding is configurable per school and applied at runtime,
- core printouts are template-driven and branded per school,
- operational dashboards and audit trails are in place.

---

## 15) Instruction to Developers Before Any New Feature Work

Before implementing any new module:
1. Add/confirm `schoolId` ownership.
2. Add entitlement key and plan mapping.
3. Decide if module output needs template-based print support.
4. Add audit events for create/update/delete/export/print actions.
5. Add tenant isolation tests.

This instruction must be part of every PR checklist moving forward.
