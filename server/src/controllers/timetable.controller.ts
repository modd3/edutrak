// src/controllers/timetable.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { DayOfWeek } from '@prisma/client';
import timetableService from '../services/timetable.service';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createTimetableSchema = z.object({
  academicYearId: z.string().uuid(),
  termId: z.string().uuid().optional(),
  classId: z.string().uuid(),
  streamId: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
});

const updateTimetableSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  termId: z.string().uuid().nullable().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

const createPeriodSchema = z.object({
  name: z.string().min(1).max(80),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  orderIndex: z.number().int().min(0),
  isBreak: z.boolean().optional(),
});

const updatePeriodSchema = createPeriodSchema.partial();

const upsertSlotSchema = z.object({
  periodId: z.string().uuid(),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  classSubjectId: z.string().uuid().nullable().optional(),
  teacherId: z.string().uuid().nullable().optional(),
  room: z.string().max(60).nullable().optional(),
  notes: z.string().max(240).nullable().optional(),
});

const deleteSlotSchema = z.object({
  periodId: z.string().uuid(),
  dayOfWeek: z.nativeEnum(DayOfWeek),
});

const querySchema = z.object({
  academicYearId: z.string().uuid().optional(),
  termId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class TimetableController {
  // ── Timetable CRUD ──────────────────────────────────────────────────────────

  /**
   * POST /api/timetables
   * Create a new timetable (Admin / Super Admin).
   */
  createTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = createTimetableSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const timetable = await timetableService.createTimetable({
        ...data,
        schoolId,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      });

      res.status(201).json({ message: 'Timetable created successfully', data: timetable });
    } catch (error) {
      this.handleError(res, error, 'CREATE_TIMETABLE_FAILED');
    }
  };

  /**
   * GET /api/timetables
   * List timetables for the school with optional filters.
   */
  listTimetables = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = querySchema.parse(req.query);
      const schoolId = req.user!.schoolId!;

      const timetables = await timetableService.getTimetablesBySchool(schoolId, {
        academicYearId: query.academicYearId,
        termId: query.termId,
        classId: query.classId,
        isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      });

      res.json({ data: timetables });
    } catch (error) {
      this.handleError(res, error, 'LIST_TIMETABLES_FAILED');
    }
  };

  /**
   * GET /api/timetables/:id
   * Get a single timetable with all periods and slots.
   */
  getTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;

      const timetable = await timetableService.getTimetableById(id, schoolId);
      if (!timetable) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Timetable not found' });
        return;
      }

      res.json({ data: timetable });
    } catch (error) {
      this.handleError(res, error, 'GET_TIMETABLE_FAILED');
    }
  };

  /**
   * GET /api/timetables/class/:classId/active
   * Get the currently active timetable for a class (teacher / student read).
   */
  getActiveForClass = async (req: Request, res: Response): Promise<void> => {
    try {
      const { classId } = req.params;
      const { streamId } = req.query as { streamId?: string };
      const schoolId = req.user!.schoolId!;

      const timetable = await timetableService.getActiveTimetableForClass(classId, schoolId, streamId);
      if (!timetable) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'No active timetable found for this class' });
        return;
      }

      res.json({ data: timetable });
    } catch (error) {
      this.handleError(res, error, 'GET_ACTIVE_TIMETABLE_FAILED');
    }
  };

  /**
   * GET /api/timetables/teacher/:teacherId/schedule
   * Get all slots for a teacher across active timetables.
   */
  getTeacherSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teacherId } = req.params;
      const schoolId = req.user!.schoolId!;

      const slots = await timetableService.getTimetableForTeacher(teacherId, schoolId);
      res.json({ data: slots });
    } catch (error) {
      this.handleError(res, error, 'GET_TEACHER_SCHEDULE_FAILED');
    }
  };

  /**
   * PATCH /api/timetables/:id
   * Update timetable metadata (Admin / Super Admin).
   */
  updateTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = updateTimetableSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const timetable = await timetableService.updateTimetable(id, schoolId, {
        ...data,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : data.effectiveTo === null ? null : undefined,
        termId: data.termId === null ? null : data.termId,
      });

      res.json({ message: 'Timetable updated successfully', data: timetable });
    } catch (error) {
      this.handleError(res, error, 'UPDATE_TIMETABLE_FAILED');
    }
  };

  /**
   * DELETE /api/timetables/:id
   * Delete a timetable and all its periods/slots (Admin / Super Admin).
   */
  deleteTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;

      await timetableService.deleteTimetable(id, schoolId);
      res.json({ message: 'Timetable deleted successfully' });
    } catch (error) {
      this.handleError(res, error, 'DELETE_TIMETABLE_FAILED');
    }
  };

  // ── Periods ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/timetables/:timetableId/periods
   */
  createPeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { timetableId } = req.params;
      const data = createPeriodSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const period = await timetableService.createPeriod({ ...data, timetableId }, schoolId);
      res.status(201).json({ message: 'Period created', data: period });
    } catch (error) {
      this.handleError(res, error, 'CREATE_PERIOD_FAILED');
    }
  };

  /**
   * PATCH /api/timetables/:timetableId/periods/:periodId
   */
  updatePeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { timetableId, periodId } = req.params;
      const data = updatePeriodSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const period = await timetableService.updatePeriod(periodId, timetableId, schoolId, data);
      res.json({ message: 'Period updated', data: period });
    } catch (error) {
      this.handleError(res, error, 'UPDATE_PERIOD_FAILED');
    }
  };

  /**
   * DELETE /api/timetables/:timetableId/periods/:periodId
   */
  deletePeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { timetableId, periodId } = req.params;
      const schoolId = req.user!.schoolId!;

      await timetableService.deletePeriod(periodId, timetableId, schoolId);
      res.json({ message: 'Period deleted' });
    } catch (error) {
      this.handleError(res, error, 'DELETE_PERIOD_FAILED');
    }
  };

  // ── Slots ────────────────────────────────────────────────────────────────────

  /**
   * PUT /api/timetables/:timetableId/slots
   * Upsert a single grid cell.
   */
  upsertSlot = async (req: Request, res: Response): Promise<void> => {
    try {
      const { timetableId } = req.params;
      const data = upsertSlotSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const slot = await timetableService.upsertSlot(
        {
          timetableId,
          ...data,
          classSubjectId: data.classSubjectId ?? undefined,
          teacherId: data.teacherId ?? undefined,
          room: data.room ?? undefined,
          notes: data.notes ?? undefined,
        },
        schoolId
      );

      res.json({ message: 'Slot saved', data: slot });
    } catch (error) {
      this.handleError(res, error, 'UPSERT_SLOT_FAILED');
    }
  };

  /**
   * DELETE /api/timetables/:timetableId/slots
   * Remove a single grid cell.
   */
  deleteSlot = async (req: Request, res: Response): Promise<void> => {
    try {
      const { timetableId } = req.params;
      const data = deleteSlotSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      await timetableService.deleteSlot({ timetableId, ...data }, schoolId);
      res.json({ message: 'Slot cleared' });
    } catch (error) {
      this.handleError(res, error, 'DELETE_SLOT_FAILED');
    }
  };

  // ── Utility ─────────────────────────────────────────────────────────────────

  private handleError(res: Response, error: unknown, code: string) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.issues });
      return;
    }
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: code, message });
  }
}

export default new TimetableController();
