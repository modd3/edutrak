// src/services/parent.service.ts
import { Prisma } from '@prisma/client';
import { BaseService } from './base.service';
import type {
  GetInvoicesQuery,
  FeeInvoiceWithDetails,
  PaginatedResponse,
  FeePaymentWithDetails,
  GetPaymentsQuery,
} from '../types/fee.types';

interface ParentInvoicesQuery extends Omit<GetInvoicesQuery, 'studentId'> {
  studentIds?: string[];
}

interface ParentPaymentsQuery extends Omit<GetPaymentsQuery, 'studentId'> {
  studentIds?: string[];
}

export class ParentService extends BaseService {
  
  /**
   * Get all children (students) for a parent/guardian
   */
  async getMyChildren(): Promise<Array<{
    id: string;
    admissionNo: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    class?: {
      id: string;
      name: string;
      level: string;
    };
    school?: {
      id: string;
      name: string;
    };
  }>> {
    const { user } = this.getAuthContext();
    if (!user) throw new Error('Authentication required');

    // Find the guardian record for this user
    const guardian = await this.prisma.guardian.findUnique({
      where: { userId: user.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                school: {
                  select: {
                    id: true,
                    name: true,
                  }
                },
                enrollments: {
                  where: {
                    status: 'ACTIVE'
                  },
                  include: {
                    class: {
                      select: {
                        id: true,
                        name: true,
                        level: true,
                      }
                    }
                  },
                  take: 1,
                  orderBy: {
                    createdAt: 'desc'
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!guardian) {
      return [];
    }

    return guardian.students.map(sg => ({
      id: sg.student.id,
      admissionNo: sg.student.admissionNo,
      firstName: sg.student.firstName,
      middleName: sg.student.middleName,
      lastName: sg.student.lastName,
      gender: sg.student.gender,
      class: sg.student.enrollments[0]?.class,
      school: sg.student.school,
    }));
  }

  /**
   * Get fee invoices for all my children
   */
  async getMyChildrenInvoices(query: ParentInvoicesQuery = {}): Promise<PaginatedResponse<FeeInvoiceWithDetails>> {
    const { user } = this.getAuthContext();
    if (!user) throw new Error('Authentication required');

    // Get all children first
    const children = await this.getMyChildren();
    const studentIds = children.map(child => child.id);

    if (studentIds.length === 0) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      };
    }

    const {
      page = 1,
      limit = 20,
      status,
      academicYearId,
      termId,
      isOverdue,
    } = query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.FeeInvoiceWhereInput = {
      studentId: {
        in: studentIds
      },
    };

    if (status) {
      where.status = status as any;
    }

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (termId) {
      where.termId = termId;
    }

    if (isOverdue) {
      where.dueDate = {
        lt: new Date(),
      };
      where.status = {
        in: ['UNPAID', 'PARTIAL'],
      };
    }

    // Get total count
    const total = await this.prisma.feeInvoice.count({ where });

    // Get invoices
    const invoices = await this.prisma.feeInvoice.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            middleName: true,
            lastName: true,
          }
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
          }
        },
        academicYear: {
          select: {
            id: true,
            year: true,
          }
        },
        term: {
          select: {
            id: true,
            name: true,
            termNumber: true,
          }
        },
        items: {
          include: {
            feeItem: {
              select: {
                id: true,
                name: true,
                category: true,
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            receiptNo: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit,
    });

    return {
      data: invoices as FeeInvoiceWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get a specific invoice (if it belongs to my children)
   */
  async getMyChildInvoice(invoiceId: string): Promise<FeeInvoiceWithDetails | null> {
    const { user } = this.getAuthContext();
    if (!user) throw new Error('Authentication required');

    // Get all children first
    const children = await this.getMyChildren();
    const studentIds = children.map(child => child.id);

    if (studentIds.length === 0) {
      return null;
    }

    const invoice = await this.prisma.feeInvoice.findFirst({
      where: {
        id: invoiceId,
        studentId: {
          in: studentIds
        }
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            middleName: true,
            lastName: true,
          }
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
          }
        },
        academicYear: {
          select: {
            id: true,
            year: true,
          }
        },
        term: {
          select: {
            id: true,
            name: true,
            termNumber: true,
          }
        },
        items: {
          include: {
            feeItem: {
              select: {
                id: true,
                name: true,
                category: true,
              }
            }
          }
        },
        payments: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: {
            paidAt: 'desc'
          }
        }
      },
    });

    return invoice as FeeInvoiceWithDetails | null;
  }

  /**
   * Get payment history for all my children
   */
  async getMyChildrenPayments(query: ParentPaymentsQuery = {}): Promise<PaginatedResponse<FeePaymentWithDetails>> {
    const { user } = this.getAuthContext();
    if (!user) throw new Error('Authentication required');

    // Get all children first
    const children = await this.getMyChildren();
    const studentIds = children.map(child => child.id);

    if (studentIds.length === 0) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      };
    }

    const {
      page = 1,
      limit = 20,
      method,
      status,
      startDate,
      endDate,
      invoiceId,
    } = query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.FeePaymentWhereInput = {
      studentId: {
        in: studentIds
      },
    };

    if (method) {
      where.method = method as any;
    }

    if (status) {
      where.status = status as any;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.paidAt.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await this.prisma.feePayment.count({ where });

    // Get payments
    const payments = await this.prisma.feePayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            middleName: true,
            lastName: true,
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
          }
        }
      },
      orderBy: {
        paidAt: 'desc'
      },
      skip: offset,
      take: limit,
    });

    return {
      data: payments as FeePaymentWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get payment summary for my children
   */
  async getMyChildrenPaymentSummary(): Promise<{
    totalOutstanding: number;
    totalPaid: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    children: Array<{
      studentId: string;
      studentName: string;
      admissionNo: string;
      totalOutstanding: number;
      totalPaid: number;
      unpaidInvoices: number;
      overdueInvoices: number;
    }>;
  }> {
    const { user } = this.getAuthContext();
    if (!user) throw new Error('Authentication required');

    // Get all children first
    const children = await this.getMyChildren();
    const studentIds = children.map(child => child.id);

    if (studentIds.length === 0) {
      return {
        totalOutstanding: 0,
        totalPaid: 0,
        unpaidInvoices: 0,
        overdueInvoices: 0,
        children: [],
      };
    }

    // Get summary data for each child
    const childrenSummary = await Promise.all(
      children.map(async (child) => {
        const invoices = await this.prisma.feeInvoice.findMany({
          where: { studentId: child.id },
          select: {
            status: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            dueDate: true,
          },
        });

        const totalOutstanding = invoices.reduce(
          (sum, inv) => sum + Number(inv.balanceAmount), 
          0
        );
        const totalPaid = invoices.reduce(
          (sum, inv) => sum + Number(inv.paidAmount), 
          0
        );
        
        const unpaidInvoices = invoices.filter(
          inv => inv.status === 'UNPAID' || inv.status === 'PARTIAL'
        ).length;
        
        const overdueInvoices = invoices.filter(
          inv => (inv.status === 'UNPAID' || inv.status === 'PARTIAL') &&
                 inv.dueDate && new Date(inv.dueDate) < new Date()
        ).length;

        return {
          studentId: child.id,
          studentName: `${child.firstName} ${child.lastName}`,
          admissionNo: child.admissionNo,
          totalOutstanding,
          totalPaid,
          unpaidInvoices,
          overdueInvoices,
        };
      })
    );

    // Calculate overall totals
    const totalOutstanding = childrenSummary.reduce((sum, child) => sum + child.totalOutstanding, 0);
    const totalPaid = childrenSummary.reduce((sum, child) => sum + child.totalPaid, 0);
    const unpaidInvoices = childrenSummary.reduce((sum, child) => sum + child.unpaidInvoices, 0);
    const overdueInvoices = childrenSummary.reduce((sum, child) => sum + child.overdueInvoices, 0);

    return {
      totalOutstanding,
      totalPaid,
      unpaidInvoices,
      overdueInvoices,
      children: childrenSummary,
    };
  }
}