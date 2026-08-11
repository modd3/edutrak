import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain a special character');

export const onboardingSchema = z.object({
  school: z.object({
    name: z.string().min(2, 'School name must be at least 2 characters').trim(),
    type: z.enum(['PRIMARY', 'SECONDARY', 'TVET', 'SPECIAL_NEEDS', 'PRE_PRIMARY'], {
      message: 'School type is required',
    }),
    county: z.string().min(1, 'County is required'),
    subCounty: z.string().optional(),
    ward: z.string().optional(),
    ownership: z.enum(['PUBLIC', 'PRIVATE', 'FAITH_BASED', 'NGO'], {
      message: 'Ownership is required',
    }),
    boardingStatus: z.enum(['DAY', 'BOARDING', 'BOTH'], {
      message: 'Boarding status is required',
    }),
    gender: z.enum(['BOYS', 'GIRLS', 'MIXED'], {
      message: 'School gender is required',
    }),
    phone: z.string().optional(),
    email: z.string().email('Invalid school email').optional().or(z.literal('')),
    address: z.string().optional(),
    registrationNo: z.string().optional(),
    knecCode: z.string().optional(),
    kemisCode: z.string().optional(),
  }),

  admin: z.object({
    firstName: z.string().min(1, 'First name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    middleName: z.string().optional(),
    email: z.string().email('Valid email is required').trim(),
    password: passwordSchema,
    phone: z.string().optional(),
    idNumber: z.string().optional(),
  }),

  plan: z.object({
    planId: z.string().min(1, 'Please select a plan'),
    startTrial: z.boolean(),
  }),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const STEPS = ['School details', 'Administrator', 'Choose plan', 'Review'] as const;
export type StepIndex = 0 | 1 | 2 | 3;
