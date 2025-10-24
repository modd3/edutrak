import { Router } from 'express';
import { GuardianController } from '../controllers/guardian.controller';
import { authenticateToken, requireAdmin, requireGuardian } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const guardianController = new GuardianController();

router.use(authenticateToken);

// Guardian management (Admin only)
router.post('/', requireAdmin, guardianController.createGuardian);
router.post('/with-user', requireAdmin, guardianController.createGuardianWithUser);
router.patch('/set-primary', requireAdmin, guardianController.setPrimaryGuardian);
router.delete('/students/:studentId/guardians/:guardianId', requireAdmin, guardianController.removeGuardianFromStudent);

// Guardian access
router.get('/', validatePagination, guardianController.getGuardians);
router.get('/:id', validateUUIDParam, guardianController.getGuardianById);
router.get('/user/:userId', validateUUIDParam, guardianController.getGuardianByUserId);
router.get('/:guardianId/students', validateUUIDParam, guardianController.getGuardianStudents);
router.get('/students/:studentId/guardians', validateUUIDParam, guardianController.getStudentGuardians);
router.get('/:guardianId/notifications', validateUUIDParam, requireGuardian, guardianController.getGuardianNotifications);

// Guardian updates (Admin only)
router.put('/:id', requireAdmin, validateUUIDParam, guardianController.updateGuardian);

export default router;