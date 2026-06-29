// src/config/feature-registry.ts

export const FEATURE_REGISTRY = {
    'fees.core':           { name: 'Fee Management',       limitType: 'BOOLEAN' },
    'fees.mpesa':          { name: 'M-PESA Integration',   limitType: 'BOOLEAN' },
    'fees.report':         { name: 'Fee Reports',          limitType: 'BOOLEAN' },
    'fees.reconciliation': { name: 'Bank Reconciliation',  limitType: 'BOOLEAN' },
    'fees.late_fees':      { name: 'Late Fees',            limitType: 'BOOLEAN' },
    'academic.core':       { name: 'Academic Management',  limitType: 'BOOLEAN' },
    'assessments.bulk':    { name: 'Bulk Grade Entry',     limitType: 'BOOLEAN' },
    'students.max':        { name: 'Student Limit',        limitType: 'COUNT' },
    'teachers.max':        { name: 'Teacher Limit',        limitType: 'COUNT' },
    'sms.monthly_quota':   { name: 'SMS Quota',            limitType: 'COUNT' },
    'lms.core':            { name: 'Learning Management',  limitType: 'BOOLEAN' },
} as const;

export type FeatureKey = keyof typeof FEATURE_REGISTRY;
export const isValidFeatureKey = (key: string): key is FeatureKey => key in FEATURE_REGISTRY;