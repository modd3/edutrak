# Edutrak Billing & Subscriptions Module – SaaS Polish Implementation Guide

**Version**: 1.0  
**Date**: 2026-07-11  
**Target Audience**: AI Coding Agent / Development Team  
**Goal**: Transform the existing billing/subscriptions module into a production-ready, reliable, automated, and self-service-friendly SaaS component.  
**Scope**: Focus on making the module **functionally complete and production-ready** before moving to broader platform improvements.  
**Dependencies**: Latest codebase state (post 2026-07-11 push that added auto `billingAccount` creation in `createSubscription`).

This guide is self-contained. Follow it sequentially. Cross-references to actual Edutrak files are included.

---

## 1. Executive Summary & Objectives

### Current Strengths (Leverage These)
- Solid `TenantSubscription` model with clean status machine (`TRIALING`, `ACTIVE`, `PAST_DUE`, `GRACE`, `SUSPENDED`, `CANCELED`, `EXPIRED`).
- Recent improvement (latest push): `createSubscription` now auto-creates `billingAccount` if missing.
- Existing payment providers (Daraja/M-Pesa + Flutterwave), webhook controller, idempotency middleware.
- Strong fee sub-services (late fees, reconciliation, reminders, analytics).
- Good multi-tenancy via `schoolId` + audit logging.
- Rich frontend components already exist (`MySubscriptionPage`, billing modals, `use-fees.ts`).

### Target State After This Guide
- Automatic end-to-end payment confirmation (webhooks update invoices & subscriptions reliably).
- Automated dunning & reminders with minimal manual work.
- Self-service billing portal that feels complete (clear overview, one-click actions).
- Proration-ready plan changes.
- Clear financial visibility (outstanding balance, recent invoices, usage).
- Production-grade error handling, logging, and auditability.
- Maintains existing patterns (school context, audit logs, Prisma usage).

**Success Criteria**:
- Creating a subscription automatically sets up billing account.
- Payments via M-Pesa/Flutterwave update invoice status automatically in >90% of cases.
- Schools can view and manage their subscription + invoices with minimal support tickets.
- Dunning reduces overdue invoices noticeably.

---

## 2. Latest Codebase State (Verified 2026-07-11)

### Key Files & Current Behavior
- `server/src/services/subscription.service.ts` (latest SHA reflects auto `billingAccount` creation in `createSubscription` + full status transition logic).
- `server/src/services/fee.service.ts` (large but contains core invoice/payment logic + sub-services in `server/src/services/fee/`).
- `frontend/src/hooks/use-fees.ts` (26k+ lines – central data layer for fees/billing).
- `frontend/src/pages/billing/MySubscriptionPage.tsx` and related components.
- Webhook handling exists but needs hardening for production reliability.
- `FEE_MODULE_UPGRADES.md` exists but is outdated (reflects pre-webhook state).

**Recent Positive Change (Latest Push)**:
In `createSubscription`, after plan validation, the code now does:
```typescript
const existingAccount = await (prisma as any).billingAccount.findUnique({ where: { schoolId: data.schoolId } });
if (!existingAccount) {
  // create billingAccount
}
```
This is excellent for SaaS onboarding.

---

## 3. Implementation Roadmap (Follow in Order)

### Phase 0: Documentation & Audit Refresh (Do First – 30-60 min)
**Goal**: Update living documentation so future agents have accurate context.

**Actions**:
1. Update `FEE_MODULE_UPGRADES.md` with the header provided in the previous patch (see Section 5 below).
2. Add a new section at the top of the file documenting the latest push.

### Phase 1: Core Reliability & Billing Integration (Primary Focus)
**Goal**: Make subscription + billing flows automatic and observable.

**Priority Order**:
1. Enhance `subscription.service.ts` (build on recent auto billingAccount change).
2. Add `getBillingOverview` helper (critical for frontend self-service).
3. Harden webhook processing (controller + service).
4. Expose new endpoints (thin controller layer).
5. Frontend integration (update `use-fees.ts` + `MySubscriptionPage`).

### Phase 2: Automation & Self-Service Polish
- Automated dunning sequences.
- Proration logic in `changePlan`.
- Payment plan / installment support (if time allows).

### Phase 3: Reporting & Production Hardening
- Financial exports and dashboards.
- Comprehensive testing + monitoring.

---

## 4. Detailed File-by-File Changes

### 4.1 `FEE_MODULE_UPGRADES.md` – Documentation Update

**Action**: Prepend / replace the top section with the following comprehensive header.

```markdown
# Fee Module Analysis: Current State & SaaS Readiness

**Last Updated**: 2026-07-11 (Post latest push – auto billingAccount creation)

## Recent Progress (Latest Push)
- `subscription.service.ts`: `createSubscription` now **automatically creates a `billingAccount`** if one does not exist for the school. Excellent SaaS onboarding improvement.
- Webhook foundation, idempotency middleware, and subscription status machine are functional.
- Core fee flows remain solid.

## Current Implementation Assessment (Updated 2026-07-11)

**✅ What's Working Well**:
- Invoice & payment core flow
- Multi-payment methods + automatic status derivation
- Partial payments, waivers, discounts
- Strong multi-tenancy + audit logging
- Subscription lifecycle (trials, plan changes, renewals, status transitions)
- **New**: Auto `billingAccount` creation on subscription start
- Payment providers (Daraja + Flutterwave) + webhook handling started
- Idempotency middleware
- Late fees, reminders, reconciliation, analytics sub-services

**Gaps to Close in This Implementation**:
- Webhook reliability & automatic status updates from async payments
- Full automated dunning
- Self-service data visibility (`getBillingOverview`)
- Proration on plan changes
- Production error handling & observability
```

---

### 4.2 `server/src/services/subscription.service.ts` – Core Enhancements

**Goal**: Build directly on the recent auto `billingAccount` creation. Add observability and a powerful new helper method.

**Recommended Changes** (apply as one cohesive patch):

#### Enhancement A: Improve `createSubscription` (after existing billingAccount block)

Add audit logging for the billing account linkage and prepare for future initial invoice creation.

```typescript
// After the existing billingAccount creation block in createSubscription, add:

// Ensure billing account linkage is audited
const billingAccount = await (prisma as any).billingAccount.findUnique({
  where: { schoolId: data.schoolId },
});

if (createdByUserId && billingAccount) {
  await (prisma as any).auditLog.create({
    data: {
      schoolId: data.schoolId,
      actorId: createdByUserId,
      actorRole: 'ADMIN',
      action: 'BILLING_ACCOUNT_LINKED',
      entityType: 'BillingAccount',
      entityId: billingAccount.id,
      entityName: `Billing account for school ${data.schoolId}`,
      details: `Billing account auto-linked during subscription creation`,
    },
  });
}

// TODO (Phase 2): Optionally create initial pro-rata or setup invoice here
// if (plan.priceMinor > 0 && !data.trialEndsAt) { ... }
```

#### Enhancement B: Add New Method `getBillingOverview`

Add this new method at the end of the class (before the closing `}` of `SubscriptionService`).

```typescript
/**
 * Returns a consolidated billing & subscription overview for a school.
 * This is the primary data source for MySubscriptionPage and admin billing views.
 */
async getBillingOverview(schoolId: string) {
  const [subscription, billingAccount, recentInvoices, outstanding] = await Promise.all([
    (prisma as any).tenantSubscription.findFirst({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { include: { features: true } },
      },
    }),
    (prisma as any).billingAccount.findUnique({
      where: { schoolId },
    }),
    (prisma as any).invoice.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        dueDate: true,
        createdAt: true,
      },
    }),
    // Simple outstanding balance calculation (can be replaced with aggregation later)
    (prisma as any).invoice.aggregate({
      where: {
        schoolId,
        status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    subscription,
    billingAccount,
    recentInvoices,
    outstandingBalance: outstanding._sum.totalAmount || 0,
    hasActiveSubscription: !!subscription && ['ACTIVE', 'TRIALING'].includes(subscription.status),
  };
}
```

**Why this method?**  
It gives the frontend everything it needs in one call and makes the module feel complete.

---

### 4.3 Controller Layer – Expose the New Method

**File**: `server/src/controllers/subscription.controller.ts` (or create if missing – check existing pattern in `billing-invoice.controller.ts`)

Add a new route handler:

```typescript
// In subscription.controller.ts
async getBillingOverview(req: Request, res: Response) {
  const { schoolId } = req.params; // or from school context middleware
  const overview = await this.subscriptionService.getBillingOverview(schoolId);
  res.json(overview);
}
```

Register the route in `server/src/routes/subscription.routes.ts`:

```typescript
router.get('/schools/:schoolId/billing-overview', 
  authMiddleware, 
  schoolContextMiddleware,
  subscriptionController.getBillingOverview.bind(subscriptionController)
);
```

---

### 4.4 Frontend Integration

#### Update `frontend/src/hooks/use-fees.ts`

Add a new hook or extend existing one:

```typescript
export function useBillingOverview(schoolId: string) {
  return useQuery({
    queryKey: ['billing-overview', schoolId],
    queryFn: () => api.get(`/subscriptions/schools/${schoolId}/billing-overview`).then(r => r.data),
    enabled: !!schoolId,
  });
}
```

#### Update `frontend/src/pages/billing/MySubscriptionPage.tsx`

Use the new hook to display:
- Current plan + status
- Outstanding balance
- Recent invoices list (with pay button)
- Quick actions (change plan, view full history)

Example usage pattern (match existing component style):

```tsx
const { data: overview, isLoading } = useBillingOverview(schoolId);

if (isLoading) return <LoadingSpinner />;

return (
  <div>
    <SubscriptionOverviewCard subscription={overview.subscription} />
    <OutstandingBalanceCard amount={overview.outstandingBalance} />
    <RecentInvoicesTable invoices={overview.recentInvoices} />
  </div>
);
```

---

### 4.5 Webhook Hardening (Critical for Reliability)

**File**: `server/src/controllers/webhook.controller.ts`

Recommended improvements:
- Add better error handling and logging.
- Ensure idempotency using existing middleware.
- On successful payment confirmation, automatically update related invoice + subscription status.

Example addition inside the M-Pesa/Flutterwave webhook handler:

```typescript
// After successful payment verification
await this.invoiceService.markAsPaid(invoiceId, paymentData);
await this.subscriptionService.transitionSubscriptionStatus(subscriptionId, 'ACTIVE');
```

Add comprehensive try/catch + structured logging using the existing `logger`.

---

## 5. Complete Ready-to-Apply Patches

### Patch for `subscription.service.ts` (Recommended First Change)

Use the exact diff provided in the previous message (the one containing `getBillingOverview` + audit logging).

### Patch for `FEE_MODULE_UPGRADES.md`

Use the header provided in Section 4.1.

---

## 6. Testing Strategy

1. **Unit Tests**:
   - `createSubscription` with and without existing billing account.
   - `getBillingOverview` returns correct shape and outstanding balance calculation.

2. **Integration Tests**:
   - Full flow: Create subscription → Auto billingAccount created → Webhook payment → Invoice + subscription updated.

3. **Manual / E2E**:
   - Use Postman or frontend to create subscription for a school without billing account.
   - Simulate M-Pesa payment via webhook and verify automatic status update.

---

## 7. Risks & Best Practices to Follow

- **Always use existing patterns**: `schoolId` scoping, audit logging, `(prisma as any)` casting (until full types are added), Winston `logger`.
- **Idempotency**: Reuse existing `idempotency.middleware.ts` on all payment-related endpoints.
- **Error Handling**: Throw clear errors and let the global error handler manage responses.
- **Multi-tenancy**: Never bypass `schoolContextMiddleware`.
- **Performance**: The new `getBillingOverview` uses `Promise.all` – keep it lean.
- **Future-proofing**: The TODO comment for initial invoice creation is intentional – implement in Phase 2.

---

## 8. Rollout & Next Steps After This Guide

1. Apply patches in order (documentation → subscription.service.ts → controller → frontend).
2. Test thoroughly in staging.
3. Mark milestone: **"Billing/Subscriptions – Functionally Production Ready"**.
4. Move to next critical area (recommended: broader Production Readiness – observability, security, scalability).

---

**This guide contains everything needed for another AI agent to implement the changes without prior context.** All code examples are tailored to Edutrak’s existing style and file structure.

If you need additional patches (e.g., full webhook hardening diff or frontend component updates), request them specifically. 

**Ready for execution.**