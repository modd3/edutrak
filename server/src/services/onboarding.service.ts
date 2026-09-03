import { randomUUID } from 'crypto';
import prisma from '../database/client';
import { hashPassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';
import { OnboardingInput } from '../validation/onboarding.validation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate subscription period end from now based on billing interval.
 */
function calcPeriodEnd(interval: string, from: Date): Date {
  const d = new Date(from);
  if (interval === 'MONTHLY') d.setMonth(d.getMonth() + 1);
  else if (interval === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
  else if (interval === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1); // fallback to monthly
  return d;
}

// ─── Result type ──────────────────────────────────────────────────────────────

export interface OnboardingResult {
  school: { id: string; name: string };
  subscription: { id: string; status: string; trialEndsAt: Date | null };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId: string;
  };
  token: string;
  refreshToken: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class OnboardingService {
  /**
   * Single-school workspace provisioning (School IS the tenant).
   *
   * Order inside the transaction:
   *  1. Guard: email uniqueness
   *  2. Guard: plan exists and is active
   *  3. Create School
   *  4. Create BillingAccount (linked to School)
   *  5. Create TenantSubscription
   *  6. Create BillingInvoice
   *  7. Create User (ADMIN, linked to School)
   *
   * If any step throws, Prisma rolls the entire transaction back.
   */
  async register(input: OnboardingInput): Promise<OnboardingResult> {
    const { school: schoolData, admin: adminData, plan: planData } = input;

    // ── Pre-flight checks (outside transaction so errors are cheap) ──────────

    // 1. Check email uniqueness before entering the transaction
    const existingUser = await (prisma as any).user.findUnique({
      where: { email: adminData.email },
    });
    if (existingUser) {
      throw new Error('An account with this email address already exists');
    }

    // 2. Validate plan exists and is active
    const plan = await (prisma as any).plan.findUnique({
      where: { id: planData.planId },
    });
    if (!plan) {
      throw new Error('Selected plan does not exist');
    }
    if (!plan.isActive) {
      throw new Error('Selected plan is not currently available');
    }

    // ── Atomic provisioning transaction ──────────────────────────────────────

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const now = new Date();

      // 3. School
      const school = await tx.school.create({
        data: {
          id: randomUUID(),
          name: schoolData.name,
          type: schoolData.type,
          county: schoolData.county,
          subCounty: schoolData.subCounty ?? null,
          ward: schoolData.ward ?? null,
          ownership: schoolData.ownership,
          boardingStatus: schoolData.boardingStatus,
          gender: schoolData.gender,
          phone: schoolData.phone ?? null,
          email: schoolData.email ?? null,
          address: schoolData.address ?? null,
          registrationNo: schoolData.registrationNo ?? null,
          knecCode: schoolData.knecCode ?? null,
          kemisCode: schoolData.kemisCode ?? null,
        },
      });

      // 5. BillingAccount
      await tx.billingAccount.create({
        data: {
          id: randomUUID(),
          schoolId: school.id,
          legalName: schoolData.name,
          email: schoolData.email ?? adminData.email,
          phone: schoolData.phone ?? null,
          preferredCurrency: plan.currency || 'KES',
        },
      });

      // 6. TenantSubscription
      const periodEnd = calcPeriodEnd(plan.billingInterval, now);
      const trialEndsAt = planData.startTrial
        ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days
        : null;
      const subscriptionStatus = planData.startTrial ? 'TRIALING' : 'ACTIVE';

      const subscription = await tx.tenantSubscription.create({
        data: {
          id: randomUUID(),
          schoolId: school.id,
          planId: plan.id,
          status: subscriptionStatus,
          startsAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialEndsAt,
        },
      });

      // 7. BillingInvoice
      //    On trial: status DRAFT (no payment expected yet)
      //    On paid:  status OPEN  (payment is due at period end)
      const invoiceStatus = planData.startTrial ? 'DRAFT' : 'OPEN';
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const schoolShort = school.id.substring(0, 8).toUpperCase();
      const invoiceNumber = `SUB-INV-${dateStr}-${schoolShort}-1`;

      await tx.billingInvoice.create({
        data: {
          id: randomUUID(),
          schoolId: school.id,
          subscriptionId: subscription.id,
          invoiceNumber,
          subtotalMinor: plan.priceMinor,
          taxMinor: 0,
          totalMinor: plan.priceMinor,
          amountPaidMinor: 0,
          currency: plan.currency || 'KES',
          status: invoiceStatus,
          dueAt: periodEnd,
        },
      });

      // 8. Admin User
      const hashedPassword = await hashPassword(adminData.password);
      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          email: adminData.email,
          password: hashedPassword,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          middleName: adminData.middleName ?? null,
          phone: adminData.phone ?? null,
          idNumber: adminData.idNumber ?? null,
          role: 'ADMIN',
          schoolId: school.id,
          isActive: true,
        },
      });

      return { school, subscription, user };
    });

    logger.info('School workspace provisioned', {
      schoolId: result.school.id,
      userId: result.user.id,
      plan: plan.key,
      startTrial: planData.startTrial,
    });

    // Audit log (fire-and-forget, non-transactional — workspace already committed)
    (prisma as any).auditLog
      .create({
        data: {
          schoolId: result.school.id,
          actorId: result.user.id,
          actorRole: 'ADMIN',
          action: 'TENANT_ONBOARDED',
          entityType: 'School',
          entityId: result.school.id,
          entityName: result.school.name,
          details: `Self-service onboarding: school "${result.school.name}" registered on plan "${plan.name}"`,
        },
      })
      .catch((err: Error) =>
        logger.warn('Onboarding audit log failed', { error: err.message })
      );

    // Issue tokens
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      schoolId: result.school.id,
      type: 'access',
    });

    const refreshToken = generateToken(
      { userId: result.user.id, type: 'refresh' },
      '7d'
    );

    return {
      school: {
        id: result.school.id,
        name: result.school.name,
      },
      subscription: {
        id: result.subscription.id,
        status: result.subscription.status,
        trialEndsAt: result.subscription.trialEndsAt,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        schoolId: result.school.id,
      },
      token,
      refreshToken,
    };
  }
}
