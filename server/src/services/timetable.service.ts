// src/services/timetable.service.ts
import { DayOfWeek, Prisma } from '@prisma/client';
import prisma from '../database/client';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateTimetableDto {
  schoolId: string;
  academicYearId: string;
  termId?: string;
  classId: string;
  streamId?: string;
  name: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface UpdateTimetableDto {
  name?: string;
  termId?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive?: boolean;
}

export interface CreatePeriodDto {
  timetableId: string;
  name: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  orderIndex: number;
  isBreak?: boolean;
}

export interface UpdatePeriodDto {
  name?: string;
  startTime?: string;
  endTime?: string;
  orderIndex?: number;
  isBreak?: boolean;
}

export interface UpsertSlotDto {
  timetableId: string;
  periodId: string;
  dayOfWeek: DayOfWeek;
  classSubjectId?: string;
  teacherId?: string;
  room?: string;
  notes?: string;
}

export interface DeleteSlotDto {
  timetableId: string;
  periodId: string;
  dayOfWeek: DayOfWeek;
}

// ─── Timetable Service ────────────────────────────────────────────────────────

export class TimetableService {
  // ── Timetables ──────────────────────────────────────────────────────────────

  async createTimetable(dto: CreateTimetableDto) {
    return prisma.timetable.create({
      data: {
        schoolId: dto.schoolId,
        academicYearId: dto.academicYearId,
        termId: dto.termId,
        classId: dto.classId,
        streamId: dto.streamId,
        name: dto.name,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo,
      },
      include: this.timetableInclude(),
    });
  }

  async getTimetablesBySchool(
    schoolId: string,
    params: { academicYearId?: string; termId?: string; classId?: string; isActive?: boolean } = {}
  ) {
    const where: Prisma.TimetableWhereInput = { schoolId };
    if (params.academicYearId) where.academicYearId = params.academicYearId;
    if (params.termId) where.termId = params.termId;
    if (params.classId) where.classId = params.classId;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return prisma.timetable.findMany({
      where,
      orderBy: [{ effectiveFrom: 'desc' }, { name: 'asc' }],
      include: this.timetableSummaryInclude(),
    });
  }

  async getTimetableById(id: string, schoolId: string) {
    return prisma.timetable.findFirst({
      where: { id, schoolId },
      include: this.timetableDetailInclude(),
    });
  }

  /**
   * Get the active timetable for a specific class (and optionally stream).
   * Used by teachers / students to show today's schedule.
   */
  async getActiveTimetableForClass(classId: string, schoolId: string, streamId?: string) {
    const now = new Date();
    return prisma.timetable.findFirst({
      where: {
        schoolId,
        classId,
        ...(streamId ? { streamId } : {}),
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: 'desc' },
      include: this.timetableDetailInclude(),
    });
  }

  /**
   * Get all slots for a teacher across all their timetables (teacher view).
   */
  async getTimetableForTeacher(teacherId: string, schoolId: string) {
    const now = new Date();
    return prisma.periodSlot.findMany({
      where: {
        teacherId,
        timetable: {
          schoolId,
          isActive: true,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
      },
      include: {
        period: true,
        timetable: {
          include: {
            class: {
              include: {
                _count: { select: { students: true } },
              },
            },
            stream: true,
          },
        },
        classSubject: {
          include: { subject: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: { orderIndex: 'asc' } }],
    });
  }

  async updateTimetable(id: string, schoolId: string, dto: UpdateTimetableDto) {
    await this.assertTimetableExists(id, schoolId);
    return prisma.timetable.update({
      where: { id },
      data: dto,
      include: this.timetableInclude(),
    });
  }

  async deleteTimetable(id: string, schoolId: string) {
    await this.assertTimetableExists(id, schoolId);
    return prisma.timetable.delete({ where: { id } });
  }

  // ── Periods ─────────────────────────────────────────────────────────────────

  async createPeriod(dto: CreatePeriodDto, schoolId: string) {
    await this.assertTimetableExists(dto.timetableId, schoolId);
    return prisma.period.create({
      data: {
        timetableId: dto.timetableId,
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        orderIndex: dto.orderIndex,
        isBreak: dto.isBreak ?? false,
      },
    });
  }

  async updatePeriod(id: string, timetableId: string, schoolId: string, dto: UpdatePeriodDto) {
    await this.assertTimetableExists(timetableId, schoolId);
    return prisma.period.update({ where: { id }, data: dto });
  }

  async deletePeriod(id: string, timetableId: string, schoolId: string) {
    await this.assertTimetableExists(timetableId, schoolId);
    return prisma.period.delete({ where: { id } });
  }

  // ── Period Slots (the grid cells) ───────────────────────────────────────────

  /**
   * Upsert a single grid cell.  If classSubjectId is provided but teacherId
   * is omitted, we look up the teacher from the ClassSubject record.
   */
  async upsertSlot(dto: UpsertSlotDto, schoolId: string) {
    await this.assertTimetableExists(dto.timetableId, schoolId);

    let teacherId = dto.teacherId;
    if (dto.classSubjectId && !teacherId) {
      const cs = await prisma.classSubject.findUnique({
        where: { id: dto.classSubjectId },
        select: { teacherId: true },
      });
      teacherId = cs?.teacherId ?? undefined;
    }

    return prisma.periodSlot.upsert({
      where: {
        timetableId_periodId_dayOfWeek: {
          timetableId: dto.timetableId,
          periodId: dto.periodId,
          dayOfWeek: dto.dayOfWeek,
        },
      },
      create: {
        timetableId: dto.timetableId,
        periodId: dto.periodId,
        dayOfWeek: dto.dayOfWeek,
        classSubjectId: dto.classSubjectId,
        teacherId,
        room: dto.room,
        notes: dto.notes,
      },
      update: {
        classSubjectId: dto.classSubjectId,
        teacherId,
        room: dto.room,
        notes: dto.notes,
      },
      include: {
        period: true,
        classSubject: { include: { subject: true, teacherProfile: { include: { user: true } } } },
        teacher: { include: { user: true } },
      },
    });
  }

  async deleteSlot(dto: DeleteSlotDto, schoolId: string) {
    await this.assertTimetableExists(dto.timetableId, schoolId);
    return prisma.periodSlot.deleteMany({
      where: {
        timetableId: dto.timetableId,
        periodId: dto.periodId,
        dayOfWeek: dto.dayOfWeek,
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async assertTimetableExists(id: string, schoolId: string) {
    const tt = await prisma.timetable.findFirst({ where: { id, schoolId } });
    if (!tt) throw new Error(`Timetable ${id} not found or not accessible`);
    return tt;
  }

  private timetableInclude() {
    return {
      class: { select: { id: true, name: true, level: true } },
      stream: { select: { id: true, name: true } },
      academicYear: { select: { id: true, year: true } },
      term: { select: { id: true, name: true, termNumber: true } },
    };
  }

  private timetableSummaryInclude() {
    return {
      ...this.timetableInclude(),
      _count: { select: { periods: true, slots: true } },
    };
  }

  private timetableDetailInclude() {
    return {
      class: { select: { id: true, name: true, level: true } },
      stream: { select: { id: true, name: true } },
      academicYear: { select: { id: true, year: true } },
      term: { select: { id: true, name: true, termNumber: true } },
      periods: {
        orderBy: { orderIndex: 'asc' as const },
        include: {
          slots: {
            include: {
              classSubject: {
                include: {
                  subject: { select: { id: true, name: true, code: true } },
                  teacherProfile: {
                    include: {
                      user: { select: { id: true, firstName: true, lastName: true } },
                    },
                  },
                },
              },
              teacher: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      },
    };
  }
}

export default new TimetableService();
