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

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/sequences', sequenceRoutes);
router.use('/schools', schoolRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/guardians', guardianRoutes);
router.use('/academic', academicRoutes);
router.use('/subjects', subjectRoutes);
router.use('/assessments', assessmentRoutes);

export default router;