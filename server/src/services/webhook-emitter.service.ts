import axios from 'axios';
import crypto from 'crypto';
import prisma from '../database/client';
import logger from '../utils/logger';

/**
 * Service to emit webhooks from EduTrak to external systems (eg. Go lms)
 */
export class WebhookEmitterService {
    private readonly LMS_WEBHOOK_URL = process.env.LMS_WEBHOOK_URL || 'http://localhost:8080/api/webhooks/edutrak';
    private readonly SHARED_SECRET = process.env.EDUTRAK_WEBHOOK_SECRET;

    async emitEvent(eventType: string, payload: any, schoolId?: string, tenantId?: string) {
        let resolvedTenantId = tenantId;
        if (!resolvedTenantId && schoolId) {
            const school = await prisma.school.findUnique({
                where: { id: schoolId},
                select: { tenantId: true},
            });
            resolvedTenantId = school?.tenantId || null
        }

        const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        const webhookPayload = {
            eventId,
            eventType,
            timestamp: new Date().toISOString(),
            schoolId, 
            data: payload, 
            source: 'edutrak',
        };

        // Sign the payload
        const signature = this.generateSignature(webhookPayload);

        const emission = await prisma.webhookEmission.create({
            data: {
                tenantId: resolvedTenantId || null,
                target: 'go-lms',
                eventType,
                eventId,
                payload: webhookPayload as any,
                signature,
                success: false,
                attempts: 1,
            }
        });

        try {
            const response = await axios.post(this.LMS_WEBHOOK_URL, webhookPayload, {
                headers: {
                    'X-Edutrak-Signature': signature,
                    'X-Event-Type': eventType,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            
            await prisma.webhookEmission.update({
                where: { id: emission.id},
                data: { success: true, lastAttempt: new Date() },
            });
            return true;
        } catch (error: any) {
            await prisma.webhookEmission.update({
                where: { id: emission.id},
                data: { 
                    success: false,
                    error: error.message,
                    attempts: { increment: 1 },
                    lastAttempt: new Date(), 
                },
            });

            logger.error(`Webhook emission failed`, {
                eventId,
                eventType,
                error: error.message
            });
            return false;
        }
    }

    private generateSignature(payload: any): string {
        return crypto.createHmac('sha256', this.SHARED_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');
    }

    // Convenience methods for common events
    async emitUserEvent(user: any, action: 'created' | 'updated' | 'deleted', tenantID?: string) {
        const payload: any = {
            userId: user.id,
            email: user.email,
            role: user.role, 
            firstName: user.firstName,
            lastName: user.lastName, 
            schoolId: user.schoolId,
            isActive: user.isActive ?? true,
        };

        // Include student profile fields if user has a student profile
        if (user.role === 'STUDENT' && user.student) {
            payload.admissionNo = user.student.admissionNo;
            payload.gender = user.student.gender;
        }
        logger.info("Emitting user event", { action, payload, userId: user.id, schoolId: user.schoolId, tenantID });
        return this.emitEvent(`user.${action}`, payload, user.schoolId, tenantID);
    }

    async emitStudentEvent(student: any, action: 'created' | 'updated' | 'deleted', tenantId?: string) {
        return this.emitEvent(`student.${action}`, {
            userId: student.id,
            email: student.user?.email,
            admissionNo: student.admissionNo, 
            firstName: student.firstName,
            lastName: student.lastName, 
            schoolId: student.schoolId,
            gender: student.gender,
            isActive: student.user?.isActive ?? true,
        }, student.schoolId, tenantId);
    }

    async emitEnrollmentEvent(enrollment: any, action: 'created' | 'updated', tenantId?: string) {
        return this.emitEvent(`enrollment.${action}`, {
            enrollmentId: enrollment.id,
            studentId: enrollment.studentId,
            classId: enrollment.classId,
            streamId: enrollment.streamId,
            academicYearId: enrollment.academicYearId,
            status: enrollment.status,
            schoolId: enrollment.school?.id || enrollment.schoolId,
        }, enrollment.school?.id || enrollment.schoolId, tenantId);
    }
}

export const webhookEmitter = new WebhookEmitterService();