# Fee Module Analysis: Current State & SaaS Readiness

## **Current Implementation Assessment**

**✅ What's Working:**

- Core invoice & payment flow (structure → invoices → payments)
- Multi-payment methods (CASH, MPESA, BANK_TRANSFER, CHEQUE, CARD, SCHOLARSHIP)
- Automatic invoice status derivation (UNPAID → PARTIAL → PAID/OVERDUE)
- Partial payments with audit trails
- Basic waivers & discounts
- School-isolated multi-tenancy

**❌ Critical Issues (Not Industry Standard):**

| Area | Problem | Impact |
|------|---------|--------|
| **Payment Processing** | M-Pesa/Bank entries are manual-only; no real payment gateway integration | No automated verification, high fraud risk, poor UX |
| **Automation** | No invoice scheduling, reminders, or auto-notifications | Requires manual admin work for every transaction |
| **Reconciliation** | No webhook handling for payment confirmations | Invoices stay "PARTIAL" indefinitely without manual updates |
| **Reporting** | Only basic summaries; no analytics or trends | Can't forecast cash flow or identify issues |
| **Refunds** | Only "reverse payment" for errors; no refund workflow | Accounting nightmare |
| **Installments** | All-or-nothing; no payment plans or installments | Rigid, poor for low-income families |
| **Late Fees** | No interest/penalties on overdue amounts | Lost revenue, poor incentive for on-time payment |
| **Multi-Provider** | Hardcoded enums; can't add new providers without code change | Not scalable |
| **Idempotency** | No duplicate payment protection | Network retries cause double-charges |
| **Webhooks** | Missing async event handling framework | Can't integrate with payment providers |

---

## **Recommendations for Mini-SaaS Isolation**

To make this a **robust, isolated payment module** usable as a standalone SaaS:

### **1. Isolation Source = School (decision: "School IS the tenant")**

> **Decision (2026-09):** Each school is the paying tenant. The whole app — request
> middleware (`req.schoolId`), billing/subscriptions, fees, and the frontend — is
> keyed by `School.id`. A parallel `Tenant` model was introduced mid-way and only ever
> populated for onboarding-created schools; fee/payment writes inserted *school ids*
> into `tenantId` FK columns (→ `PaymentProviderConfig_tenantId_fkey` violations).
> Rather than complete that migration, the `Tenant` model was **retired** and payment
> provider configs / fee refunds are keyed by `schoolId` (FK → `School`).
>
> If a genuine multi-school *organization* layer is ever needed, add it later under a
> `Organization` model with a 1:N `Organization.schools` relation — do not resurrect
> per-row `tenantId` columns.

```prisma
// Isolation is by School — no parallel Tenant table.
// PaymentProviderConfig (id, schoolId, provider, apiKey, secretKey, ...)
// FeeRefund (id, schoolId, paymentId, invoiceId, ...)
// FeeInvoice / FeePayment / LateFeesConfig / WebhookLog / WebhookEmission: schoolId-keyed
```

### **2. Build Payment Provider Abstraction**

```typescript
// New: server/src/services/payment-provider/
interface IPaymentProvider {
  initiate(charge: ChargeDTO): Promise<PaymentSession>;
  verify(transactionId: string): Promise<PaymentVerification>;
  refund(transactionId: string, amount: number): Promise<void>;
  handleWebhook(payload: any): Promise<void>;
}

// Implementations:
class DarajaProvider implements IPaymentProvider { ... }
class FlutterwaveProvider implements IPaymentProvider { ... }
class StripeProvider implements IPaymentProvider { ... }

// Factory
class PaymentProviderFactory {
  static getProvider(schoolId: string): IPaymentProvider { ... }
}
```

### **3. Add Webhook Framework**

```prisma
model WebhookLog {
  id String @id @default(uuid())
  schoolId String
  provider String // "MPESA", "FLUTTERWAVE", etc.
  event String   // "payment.confirmed", "payment.failed"
  payload Json
  processed Boolean @default(false)
  processedAt DateTime?
  error String?
}

model PaymentProviderConfig {
  id String @id @default(uuid())
  schoolId String @unique
  provider String
  apiKey String
  secretKey String
  callbackUrl String
  webhookSecret String
  isActive Boolean
}
```

### **4. Implement Idempotency & Retry Logic**

```typescript
// server/src/middleware/idempotency.ts
class IdempotencyKey {
  static async process<T>(
    key: string,
    handler: () => Promise<T>,
    ttl: number = 86400
  ): Promise<T> {
    // Check cache; if exists, return cached result
    // If not, execute handler, cache result
  }
}

// Usage in payment controller
router.post('/invoices/:id/pay-online', 
  idempotencyMiddleware(),
  async (req, res) => {
    const result = await IdempotencyKey.process(
      req.headers['idempotency-key'],
      () => paymentService.initiateOnlinePayment(...)
    );
  }
);
```

### **5. Structured Payment Plan Support**

```prisma
model PaymentPlan {
  id String @id @default(uuid())
  invoiceId String @unique
  installments Int     // e.g., 3
  frequency String     // "MONTHLY", "WEEKLY"
  firstDueDate DateTime
  createdAt DateTime @default(now())
  
  schedule PaymentPlanInstallment[]
  
  @@index([invoiceId])
}

model PaymentPlanInstallment {
  id String @id @default(uuid())
  planId String
  dueDate DateTime
  amount Decimal @db.Decimal(12,2)
  status String @default("PENDING") // PENDING, PAID, OVERDUE
  paymentId String? // NULL if unpaid
  
  @@index([planId])
}
```

### **6. Revenue Leakage Protection**

```prisma
model LateFeesConfig {
  id String @id @default(uuid())
  schoolId String @unique
  penaltyType String      // "FLAT", "PERCENTAGE", "COMPOUND"
  penaltyAmount Decimal   // 500 KES or 5%
  graceDaysDays Int       // 7 days before penalty applies
  maxPenalty Decimal?     // Cap penalty at this amount
  
  @@index([schoolId])
}

// Auto-apply late fees via scheduled job
async function applyLateFees() {
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: 'OVERDUE',
      dueDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }
  });
  
  for (const inv of overdueInvoices) {
    const penalty = calculatePenalty(inv);
    await invoice.update({ additionalAmount: penalty });
  }
}
```

### **7. Communication & Notifications**

```prisma
model PaymentReminder {
  id String @id @default(uuid())
  invoiceId String
  reminderType String // "PAYMENT_DUE", "OVERDUE_5DAYS", "FINAL_NOTICE"
  sentAt DateTime
  method String // "SMS", "EMAIL", "PUSH"
  status String // "SENT", "FAILED", "BOUNCED"
  
  @@index([invoiceId])
}

// Queue-based notification
class NotificationQueue {
  static async schedule(reminder: PaymentReminder) {
    // BullMQ / pg-boss job
    await paymentReminderQueue.add('send', reminder);
  }
}
```

### **8. Reconciliation & Reporting**

```typescript
// server/src/services/reconciliation.service.ts
class ReconciliationService {
  async matchBankStatement(file: Buffer, schoolId: string) {
    // Parse CSV → find matching payments
    // Flag unmatched transactions for review
  }
  
  async generateReconciliationReport(schoolId, from, to) {
    // Expected vs. Actual
    // Variance analysis
    // Outstanding items
  }
  
  async detectAnomalies(schoolId) {
    // Duplicate amounts within short timeframe
    // Unusually high/low amounts
    // Timing anomalies
  }
}
```

### **9. API Endpoints (New Structure)**

```
POST   /api/v1/schools/:schoolId/invoices/pay-online
       → Initiates ONLINE payment with selected provider

POST   /api/v1/webhooks/payments/mpesa
POST   /api/v1/webhooks/payments/flutterwave
       → Async payment confirmation

GET    /api/v1/schools/:schoolId/invoices/:id/payment-status
       → Real-time payment verification

POST   /api/v1/schools/:schoolId/invoices/:id/setup-payment-plan
       → Create installment plan

GET    /api/v1/schools/:schoolId/reconciliation/report
       → Bank reconciliation

POST   /api/v1/webhooks/scheduled-jobs
       → Cron trigger (send reminders, apply late fees)
```

### **10. Database Migrations Path**

```sql
-- Decision: School IS the tenant — key everything by school_id.
-- Phase 1: Add provider abstraction
CREATE TABLE payment_provider_configs (
  id UUID PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id),
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(school_id, provider)
);

-- Phase 2: Add payment plans
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL UNIQUE,
  installments INT,
  frequency TEXT
);

-- Phase 3: Add webhook logs
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY,
  school_id UUID,
  provider TEXT,
  event TEXT,
  payload JSONB,
  processed BOOLEAN
);
-- NOTE: There is NO Tenant table / tenant_id column. If a multi-school
-- organization layer is required later, model it as Organization 1:N School.
```

---

## **Implementation Roadmap (Priority Order)**

| Phase | Tasks | Timeline |
|-------|-------|----------|
| **1. Foundation** | Payment provider abstraction + Daraja integration | 2 weeks |
| **2. Core SaaS** | Webhook framework + idempotency + multi-tenant isolation | 2 weeks |
| **3. Operations** | Payment reminders + SMS/email integration | 1 week |
| **4. Revenue** | Late fees + payment plans + reconciliation | 2 weeks |
| **5. Scale** | Analytics dashboard + fraud detection + rate limiting | 2 weeks |

---

## **Key Takeaways**

Your fee module is **functionally complete but architecturally monolithic**. To make it SaaS-ready:

1. **School is the tenant** → isolation is by `School.id` end-to-end; no parallel `Tenant` model
2. **Abstract Payment Providers** → Support multiple gateways without code changes
3. **Add Async Handling** → Webhooks for real-time payment verification
4. **Automate Everything** → Reminders, late fees, reconciliation
5. **Track Idempotency** → Prevent duplicate charges
6. **Report & Analyze** → Cash flow forecasting, anomaly detection

This transforms it from a **school payment module** into a **standalone invoice/payment SaaS** that any business can use (ecommerce, subscription, rentals, etc.).

Would you like me to start implementing any of these recommendations? I'd suggest starting with **Phase 1** (payment provider abstraction + M-Pesa real integration).
