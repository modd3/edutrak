import express from 'express';
import { createClass, getClasses } from '../controllers/class.controller';
import { authenticateAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', authenticateAdmin, createClass);
router.get('/', authenticateAdmin, getClasses);

export default router;
