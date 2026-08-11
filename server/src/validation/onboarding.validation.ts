import { z } from 'zod';

// ─── Step 1: Organization Details ────────────────────────────────────────────

export const schoolDetailsSchema = z.object({
  name: z
    .string()
    .min(2, 'School name must be at least 2 characters')
    .max(255, 'School name cannot exceed 255 characters')
    .trim(),
  type: z.enum(['PRIMARY', 'SECONDARY', 'TVET', 'SPECIAL_NEEDS', 'PRE_PRIMARY']),
  county: z.string().min(1, 'County is required').trim(),
  subCounty: z.string().trim().optional(),
  ward: z.string().trim().optional(),
  ownership: z.enum(['PUBLIC', 'PRIVATE', 'FAITH_BASED', 'NGO']),
  boardingStatus: z.enum(['DAY', 'BOARDING', 'BOTH']),
  gender: z.enum(['BOYS', 'GIRLS', 'MIXED']),
  phone: z.string().trim().optional(),
  email: z.string().email('Invalid school email').trim().optional(),
  address: z.string().trim().optional(),
  registrationNo: z.string().trim().optional(),
  knecCode: z.string().trim().optional(),
  kemisCode: z.string().trim().optional(),
});

// ─── Step 2: Admin User Credentials ──────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const adminUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  middleName: z.string().trim().optional(),
  email: z.string().email('Invalid admin email address').trim().toLowerCase(),
  password: passwordSchema,
  phone: z.string().trim().optional(),
  idNumber: z.string().trim().optional(),
});

// ─── Step 3: Plan selection ───────────────────────────────────────────────────

export const planSelectionSchema = z.object({
  planId: z.string().uuid('planId must be a valid UUID'),
  /**
   * When true the subscription starts in TRIALING status with a 14-day trial.
   * When false (default) the subscription starts as ACTIVE and an OPEN invoice
   * is immediately generated.
   */
  startTrial: z.boolean().default(false),
});

// ─── Full onboarding payload ──────────────────────────────────────────────────

export const onboardingSchema = z.object({
  school: schoolDetailsSchema,
  admin: adminUserSchema,
  plan: planSelectionSchema,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type SchoolDetailsInput = z.infer<typeof schoolDetailsSchema>;
export type AdminUserInput = z.infer<typeof adminUserSchema>;
export type PlanSelectionInput = z.infer<typeof planSelectionSchema>;
