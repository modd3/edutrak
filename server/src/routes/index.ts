import { Router } from 'express';
import userRoutes from './user.routes';
import schoolRoutes from './school.routes';
import studentRoutes from './student.routes';
import teacherRoutes from './teacher.routes';
import guardianRoutes from './guardian.routes';
import academicRoutes from './academic.routes';
import subjectRoutes from './subject.routes';
import assessmentRoutes from './assessment.routes';
import authRoutes from './auth.routes'
import sequenceRoutes from './sequence.routes';
import studentClassRoutes from './studentClass.routes';
import feeRoutes from './fee.routes';
import subscriptionRoutes from './subscription.routes';
import planRoutes from './plan.routes';
import billingAccountRoutes from './billing-account.routes';
import billingInvoiceRoutes from './billing-invoice.routes';
import auditRoutes from './audit.routes';
import studentGuardianRoutes from './student-guardian.routes';
import entitlementRoutes from './entitlement.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/sequences', sequenceRoutes);
router.use('/schools', schoolRoutes);
router.use('/students', studentRoutes);
router.use('/student-classes', studentClassRoutes);
router.use('/teachers', teacherRoutes);
router.use('/guardians', guardianRoutes);
router.use('/academic', academicRoutes);
router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);
//router.use('/attendance', attendanceRoutes);
router.use('/fees', feeRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/plans', planRoutes);
router.use('/billing-accounts', billingAccountRoutes);
router.use('/billing', billingInvoiceRoutes);
router.use('/entitlements', entitlementRoutes);

// Student-Guardian relationship management
router.use('/student-guardians', studentGuardianRoutes);

// Audit logs
router.use('/audit-logs', auditRoutes);

export default router;
