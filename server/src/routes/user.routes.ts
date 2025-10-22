import { Router } from 'express';
import { createUser, getAllUsers, deleteUser } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, requireRole('ADMIN'), createUser);
router.get('/', requireAuth, requireRole('ADMIN'), getAllUsers);
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteUser);

export default router;
