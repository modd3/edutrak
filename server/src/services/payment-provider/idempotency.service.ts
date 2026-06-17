/**
 * Idempotency Service
 *
 * Prevents duplicate payment processing from network retries.
 * Uses a simple in-memory store with TTL-based expiry.
 * In production, this should be backed by Redis for persistence across restarts.
 *
 * Usage:
 * ```ts
 * const result = await IdempotencyService.process(
 *   req.headers['idempotency-key'],
 *   () => paymentService.initiateOnlinePayment(data)
 * );
 * ```
 */
import logger from '../../utils/logger';
import { IdempotencyOptions, IdempotencyRecord } from '../../types/payment-provider.types';

interface StoreEntry {
  response: unknown;
  expiresAt: number;
}

export class IdempotencyService {
  /**
   * In-memory store. Replace with Redis for production.
   * Map<key, { response, expiresAt }>
   */
  private static store: Map<string, StoreEntry> = new Map();

  /**
   * Cleanup interval handle
   */
  private static cleanupInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Default TTL: 24 hours
   */
  private static readonly DEFAULT_TTL = 86_400;

  static {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300_000);
    // Allow cleanup to not prevent process exit
    if (this.cleanupInterval && typeof this.cleanupInterval === 'object') {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Process a request with idempotency protection.
   *
   * @param idempotencyKey - Unique key from the request (e.g., from header)
   * @param handler - Async function to execute if this key hasn't been seen
   * @param options - Optional TTL and prefix configuration
   * @returns The cached result if the key was already processed, or the handler result
   */
  static async process<T>(
    idempotencyKey: string,
    handler: () => Promise<T>,
    options: IdempotencyOptions = {}
  ): Promise<T> {
    if (!idempotencyKey) {
      // No idempotency key provided — execute without caching
      logger.warn('Request made without idempotency key');
      return handler();
    }

    const ttl = options.ttl ?? this.DEFAULT_TTL;
    const prefix = options.prefix ?? 'idempotency';
    const cacheKey = `${prefix}:${idempotencyKey}`;

    // Check if we already have a cached response
    const existing = this.store.get(cacheKey);
    if (existing) {
      if (Date.now() < existing.expiresAt) {
        logger.info('Idempotency cache hit', { key: idempotencyKey });
        return existing.response as T;
      }
      // Expired entry — remove it
      this.store.delete(cacheKey);
    }

    // Execute the handler
    try {
      const result = await handler();

      // Cache the successful response
      this.store.set(cacheKey, {
        response: result,
        expiresAt: Date.now() + ttl * 1000,
      });

      logger.info('Idempotency cache set', {
        key: idempotencyKey,
        ttlSeconds: ttl,
      });

      return result;
    } catch (error) {
      // Don't cache errors — allow retries for failed requests
      logger.warn('Handler failed, not caching idempotency result', {
        key: idempotencyKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate a unique idempotency key for a payment operation.
   * Combines invoice ID, amount, and a timestamp to create uniqueness.
   */
  static generateKey(invoiceId: string, amount: number, suffix?: string): string {
    const timestamp = Date.now();
    const base = `${invoiceId}:${amount}:${timestamp}`;
    return suffix ? `${base}:${suffix}` : base;
  }

  /**
   * Check if a key has been processed.
   */
  static hasKey(idempotencyKey: string, options: IdempotencyOptions = {}): boolean {
    const prefix = options.prefix ?? 'idempotency';
    const cacheKey = `${prefix}:${idempotencyKey}`;
    const existing = this.store.get(cacheKey);
    return !!existing && Date.now() < existing.expiresAt;
  }

  /**
   * Manually invalidate an idempotency key.
   * Useful for payment retries where the user wants to re-attempt.
   */
  static invalidate(idempotencyKey: string, options: IdempotencyOptions = {}): void {
    const prefix = options.prefix ?? 'idempotency';
    const cacheKey = `${prefix}:${idempotencyKey}`;
    this.store.delete(cacheKey);
    logger.info('Idempotency key invalidated', { key: idempotencyKey });
  }

  /**
   * Get the number of cached entries (for monitoring).
   */
  static getCacheSize(): number {
    return this.store.size;
  }

  /**
   * Clear all cached entries.
   */
  static clearCache(): void {
    this.store.clear();
    logger.info('Idempotency cache cleared');
  }

  /**
   * Remove expired entries from the store.
   */
  private static cleanup(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      logger.debug('Idempotency cache cleanup', { removed, remaining: this.store.size });
    }
  }
}