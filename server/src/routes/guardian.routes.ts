import { Router } from 'express';
import { GuardianController } from '../controllers/guardian.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const guardianController = new GuardianController();

router.use(authenticate);

// Guardian management (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), guardianController.createGuardian);
router.post('/with-user', authorize('ADMIN', 'SUPER_ADMIN'), guardianController.createGuardianWithUser);
router.patch('/set-primary', authorize('ADMIN', 'SUPER_ADMIN'), guardianController.setPrimaryGuardian);
router.delete('/students/:studentId/guardians/:guardianId', authorize('ADMIN', 'SUPER_ADMIN'), guardianController.removeGuardianFromStudent);

// Guardian access
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), validatePagination, guardianController.getGuardians);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), validateUUIDParam, guardianController.getGuardianById);
router.get('/user/:userId', authorize('ADMIN', 'SUPER_ADMIN'), validateUUIDParam, guardianController.getGuardianByUserId);
router.get('/:guardianId/students', authorize('ADMIN', 'SUPER_ADMIN'), validateUUIDParam, guardianController.getGuardianStudents);
router.get('/students/:studentId/guardians', authorize('ADMIN', 'SUPER_ADMIN'), validateUUIDParam, guardianController.getStudentGuardians);
router.get('/:guardianId/notifications', validateUUIDParam, authorize('PARENT'), guardianController.getGuardianNotifications);

// Guardian updates (Admin only)
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), validateUUIDParam, guardianController.updateGuardian);

export default router;