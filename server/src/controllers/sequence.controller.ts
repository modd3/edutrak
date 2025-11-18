import { Request, Response } from 'express';
import { sequenceGenerator, SequenceType } from '../services/sequence-generator.service';

export class SequenceController {
  /**
   * GET /api/sequences/:type/preview
   * Preview the next number without generating it
   */
  async previewNext(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { schoolId } = req.query;

      const preview = await sequenceGenerator.previewNext(
        type as SequenceType,
        schoolId as string
      );

      res.json({ preview });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/sequences/:type/current
   * Get current value of sequence
   */
  async getCurrentValue(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { schoolId } = req.query;

      const currentValue = await sequenceGenerator.getCurrentValue(
        type as SequenceType,
        schoolId as string
      );

      res.json({ currentValue });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/sequences/:type/stats
   * Get statistics for a sequence type
   */
  async getStats(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { schoolId } = req.query;

      const stats = await sequenceGenerator.getSequenceStats(
        type as SequenceType,
        schoolId as string
      );

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * POST /api/sequences/:type/reset
   * Reset sequence to specific value (admin only)
   */
  async resetSequence(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { startValue, schoolId } = req.body;

      await sequenceGenerator.resetSequence(
        type as SequenceType,
        startValue,
        schoolId
      );

      res.json({ message: 'Sequence reset successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * POST /api/sequences/:type/batch
   * Generate batch of numbers (for bulk imports)
   */
  async generateBatch(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { count, schoolId } = req.body;

      if (!count || count < 1 || count > 1000) {
        return res.status(400).json({ 
          message: 'Count must be between 1 and 1000' 
        });
      }

      const numbers = await sequenceGenerator.generateBatch(
        type as SequenceType,
        count,
        schoolId
      );

      res.json({ numbers, count: numbers.length });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
    return res.json({ message: 'Batch generated successfully' });
  }
}
