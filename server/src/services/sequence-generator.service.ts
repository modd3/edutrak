// services/sequence-generator.service.ts
import { PrismaClient } from '@prisma/client';
import prisma from '../database/client';
import logger from '../utils/logger';

/**
 * Sequence types that can be auto-generated
 */
export enum SequenceType {
  ADMISSION_NUMBER = 'ADMISSION_NUMBER',
  EMPLOYEE_NUMBER = 'EMPLOYEE_NUMBER',
  RECEIPT_NUMBER = 'RECEIPT_NUMBER',
  INVOICE_NUMBER = 'INVOICE_NUMBER',
  ASSESSMENT_NUMBER = 'ASSESSMENT_NUMBER',
  CLASS_CODE = 'CLASS_CODE',
}

/**
 * Sequence configuration with format patterns
 */
interface SequenceConfig {
  prefix: string;           // e.g., "STU", "TCH", "ADM"
  suffix?: string;          // Optional suffix
  length: number;           // Total length of numeric part (e.g., 5 for "00001")
  separator?: string;       // Separator between parts (e.g., "-", "/")
  includeYear?: boolean;    // Include year (e.g., "2024")
  includeSchool?: boolean;  // Include school code
  resetAnnually?: boolean;  // Reset counter each year
}

/**
 * Sequence Generator Service
 * Generates unique, sequential numbers for various entities
 */
export class SequenceGeneratorService {
  private prisma: PrismaClient;

  // Default configurations for each sequence type
  private defaultConfigs: Record<SequenceType, SequenceConfig> = {
    [SequenceType.ADMISSION_NUMBER]: {
      prefix: 'STU',
      length: 4,
      separator: '/',
      includeYear: true,
      resetAnnually: true,
    },
    [SequenceType.EMPLOYEE_NUMBER]: {
      prefix: 'EMP',
      length: 4,
      separator: '-',
      includeYear: true,
      resetAnnually: false,
    },
    [SequenceType.RECEIPT_NUMBER]: {
      prefix: 'RCT',
      length: 6,
      separator: '/',
      includeYear: true,
      resetAnnually: true,
    },
    [SequenceType.INVOICE_NUMBER]: {
      prefix: 'INV',
      length: 6,
      separator: '/',
      includeYear: true,
      resetAnnually: true,
    },
    [SequenceType.ASSESSMENT_NUMBER]: {
      prefix: 'ASS',
      length: 4,
      separator: '-',
      includeYear: true,
      resetAnnually: true,
    },
    [SequenceType.CLASS_CODE]: {
      prefix: 'CLS',
      length: 3,
      separator: '-',
      includeYear: true,
      resetAnnually: true,
    },
  };

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Generate the next sequence number
   * Thread-safe using database transactions
   */
  async generateNext(
    type: SequenceType,
    schoolId?: string,
    customConfig?: Partial<SequenceConfig>
  ): Promise<string> {
    const config = { ...this.defaultConfigs[type], ...customConfig };
    const currentYear = new Date().getFullYear();

    return await this.prisma.$transaction(async (tx) => {
      // Build sequence key
      const sequenceKey = this.buildSequenceKey(type, schoolId, currentYear, config);

      // Get or create sequence record
      let sequence = await tx.sequence.findUnique({
        where: { key: sequenceKey },
      });

      if (!sequence) {
        // Create new sequence starting at 1
        sequence = await tx.sequence.create({
          data: {
            key: sequenceKey,
            type,
            schoolId,
            year: config.resetAnnually ? currentYear : null,
            currentValue: 1,
            prefix: config.prefix,
            lastGeneratedAt: new Date(),
          },
        });
      } else {
        // Increment existing sequence
        sequence = await tx.sequence.update({
          where: { key: sequenceKey },
          data: {
            currentValue: { increment: 1 },
            lastGeneratedAt: new Date(),
          },
        });
      }

      // Format the sequence number
      const formattedNumber = this.formatSequenceNumber(
        sequence.currentValue,
        config,
        schoolId,
        currentYear
      );

      logger.info('Sequence generated', {
        type,
        sequenceKey,
        value: sequence.currentValue,
        formatted: formattedNumber,
      });

      return formattedNumber;
    });
  }

  /**
   * Build unique sequence key for database lookup
   */
  private buildSequenceKey(
    type: SequenceType,
    schoolId: string | undefined,
    year: number,
    config: SequenceConfig
  ): string {
    const parts: string[] = [type.toString()];

    if (config.includeSchool && schoolId) {
      parts.push(schoolId);
    }

    if (config.resetAnnually) {
      parts.push(year.toString());
    }

    return parts.join('_');
  }

  /**
   * Format sequence number according to configuration
   * Examples:
   * - STU-2024-00001
   * - EMP-00123
   * - RCT/2024/000456
   * - INV/2024/SCH001/000789
   */
  private formatSequenceNumber(
    value: number,
    config: SequenceConfig,
    schoolId: string | undefined,
    year: number
  ): string {
    const parts: string[] = [];
    const separator = config.separator || '-';

    // Add prefix
    if (config.prefix) {
      parts.push(config.prefix);
    }

    // Add year if needed
    if (config.includeYear) {
      parts.push(year.toString());
    }

    // Add school code if needed
    if (config.includeSchool && schoolId) {
      parts.push(schoolId.substring(0, 6).toUpperCase());
    }

    // Add padded number
    const paddedNumber = value.toString().padStart(config.length, '0');
    parts.push(paddedNumber);

    // Add suffix if provided
    if (config.suffix) {
      parts.push(config.suffix);
    }

    return parts.join(separator);
  }

  /**
   * Get current sequence value without incrementing
   */
  async getCurrentValue(
    type: SequenceType,
    schoolId?: string
  ): Promise<number | null> {
    const config = this.defaultConfigs[type];
    const currentYear = new Date().getFullYear();
    const sequenceKey = this.buildSequenceKey(type, schoolId, currentYear, config);

    const sequence = await this.prisma.sequence.findUnique({
      where: { key: sequenceKey },
    });

    return sequence?.currentValue || null;
  }

  /**
   * Reset sequence to a specific value
   * Useful for migrations or corrections
   */
  async resetSequence(
    type: SequenceType,
    startValue: number,
    schoolId?: string
  ): Promise<void> {
    const config = this.defaultConfigs[type];
    const currentYear = new Date().getFullYear();
    const sequenceKey = this.buildSequenceKey(type, schoolId, currentYear, config);

    await this.prisma.sequence.upsert({
      where: { key: sequenceKey },
      update: {
        currentValue: startValue,
        lastGeneratedAt: new Date(),
      },
      create: {
        key: sequenceKey,
        type,
        schoolId,
        year: config.resetAnnually ? currentYear : null,
        currentValue: startValue,
        prefix: config.prefix,
        lastGeneratedAt: new Date(),
      },
    });

    logger.info('Sequence reset', { type, sequenceKey, startValue });
  }

  /**
   * Generate admission number specifically
   * Convenience method with better naming
   */
  async generateAdmissionNumber(schoolId?: string): Promise<string> {
    return this.generateNext(SequenceType.ADMISSION_NUMBER, schoolId);
  }

  /**
   * Generate employee number specifically
   */
  async generateEmployeeNumber(schoolId?: string): Promise<string> {
    return this.generateNext(SequenceType.EMPLOYEE_NUMBER, schoolId);
  }

  /**
   * Generate receipt number specifically
   */
  async generateReceiptNumber(schoolId?: string): Promise<string> {
    return this.generateNext(SequenceType.RECEIPT_NUMBER, schoolId);
  }

  /**
   * Batch generate multiple numbers
   * Useful for bulk imports
   */
  async generateBatch(
    type: SequenceType,
    count: number,
    schoolId?: string
  ): Promise<string[]> {
    const numbers: string[] = [];

    for (let i = 0; i < count; i++) {
      const number = await this.generateNext(type, schoolId);
      numbers.push(number);
    }

    return numbers;
  }

  /**
   * Preview what the next number will be without generating it
   */
  async previewNext(
    type: SequenceType,
    schoolId?: string
  ): Promise<string> {
    const config = this.defaultConfigs[type];
    const currentYear = new Date().getFullYear();
    const sequenceKey = this.buildSequenceKey(type, schoolId, currentYear, config);

    const sequence = await this.prisma.sequence.findUnique({
      where: { key: sequenceKey },
    });

    const nextValue = sequence ? sequence.currentValue + 1 : 1;

    return this.formatSequenceNumber(nextValue, config, schoolId, currentYear);
  }

  /**
   * Get sequence statistics
   */
  async getSequenceStats(type: SequenceType, schoolId?: string) {
    const config = this.defaultConfigs[type];
    const currentYear = new Date().getFullYear();

    const sequences = await this.prisma.sequence.findMany({
      where: {
        type,
        ...(schoolId && { schoolId }),
        ...(config.resetAnnually && { year: currentYear }),
      },
      orderBy: { currentValue: 'desc' },
    });

    return {
      type,
      total: sequences.reduce((sum, seq) => sum + seq.currentValue, 0),
      bySchool: sequences.map((seq) => ({
        schoolId: seq.schoolId,
        currentValue: seq.currentValue,
        lastGenerated: seq.lastGeneratedAt,
      })),
    };
  }
}

// Export singleton instance
export const sequenceGenerator = new SequenceGeneratorService();