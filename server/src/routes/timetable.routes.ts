// src/routes/timetable.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext, validateResourceOwnership } from '../middleware/school-context';
import { enforceSubscription } from '../middleware/subscription.middleware';
import timetableController from '../controllers/timetable.controller';

const router = Router();

// All timetable routes require authentication + school context
router.use(authenticate);
router.use(enforceSchoolContext);
router.use(enforceSubscription);
router.use(validateResourceOwnership);

// ── Timetables ───────────────────────────────────────────────────────────────

/** List timetables – all instructional roles */
router.get('/', timetableController.listTimetables);

/** Active timetable for a class – teachers, students, admin */
router.get('/class/:classId/active', timetableController.getActiveForClass);

/** Full teacher schedule across all active timetables */
router.get('/teacher/:teacherId/schedule', timetableController.getTeacherSchedule);

/** Get a single timetable (detail with periods+slots) */
router.get('/:id', timetableController.getTimetable);

/** Create timetable – admin only */
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), timetableController.createTimetable);

/** Update timetable metadata – admin only */
router.patch('/:id', authorize('ADMIN', 'SUPER_ADMIN'), timetableController.updateTimetable);

/** Delete timetable – admin only */
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), timetableController.deleteTimetable);

// ── Periods (time blocks in a timetable) ─────────────────────────────────────

router.post(
  '/:timetableId/periods',
  authorize('ADMIN', 'SUPER_ADMIN'),
  timetableController.createPeriod
);

router.patch(
  '/:timetableId/periods/:periodId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  timetableController.updatePeriod
);

router.delete(
  '/:timetableId/periods/:periodId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  timetableController.deletePeriod
);

// ── Slots (grid cells: day × period → subject/teacher) ───────────────────────

/** Upsert a grid cell – admin only */
router.put(
  '/:timetableId/slots',
  authorize('ADMIN', 'SUPER_ADMIN'),
  timetableController.upsertSlot
);

/** Clear a grid cell – admin only */
router.delete(
  '/:timetableId/slots',
  authorize('ADMIN', 'SUPER_ADMIN'),
  timetableController.deleteSlot
);

export default router;
