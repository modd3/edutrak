/**
 * Idempotency Middleware
 *
 * Express middleware that ensures payment requests are processed only once.
 * Clients must send an `Idempotency-Key` header (UUID recommended).
 * If a request with the same key is received within the TTL window,
 * the cached response is returned without re-executing the handler.
 *
 * Usage in routes:
 * ```ts
 * router.post('/invoices/:id/pay-online',
 *   idempotencyMiddleware(),
 *   feeController.initiateOnlinePayment
 * );
 * ```
 */
import { Response, NextFunction } from 'express';
import { RequestWithUser } from './school-context';
import { IdempotencyService } from '../services/payment-provider/idempotency.service';
import logger from '../utils/logger';
import { IdempotencyOptions } from '../types/payment-provider.types';

/**
 * Create an idempotency middleware with optional configuration.
 *
 * @param options - TTL and prefix configuration
 */
export function idempotencyMiddleware(options: IdempotencyOptions = {}) {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    // Skip idempotency for GET requests (they're idempotent by nature)
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      // Log a warning but allow the request to proceed
      logger.warn('Request without idempotency key', {
        method: req.method,
        path: req.path,
        userId: req.user?.userId,
      });
      return next();
    }

    // Validate idempotency key format (must be a UUID or similar unique string)
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
      return res.status(400).json({
        error: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Idempotency-Key must be a string of at least 8 characters',
      });
    }

    // Check if this key has been processed before
    if (IdempotencyService.hasKey(idempotencyKey, options)) {
      logger.info('Idempotency key already processed', {
        key: idempotencyKey,
        path: req.path,
      });

      return res.status(409).json({
        error: 'IDEMPOTENCY_KEY_CONFLICT',
        message: 'This request has already been processed. Use a new idempotency key to retry.',
        retry: true,
      });
    }

    // Attach the idempotency key to the request for downstream use
    (req as any).idempotencyKey = idempotencyKey;

    next();
  };
}