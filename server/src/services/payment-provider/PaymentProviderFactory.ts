/**
 * PaymentProviderFactory
 *
 * Factory for creating payment provider instances.
 * Manages provider lifecycle, caching, and tenant-specific configuration.
 *
 * Usage:
 * ```ts
 * const provider = await PaymentProviderFactory.getProvider('school-123');
 * const session = await provider.initiatePayment({ ... });
 * ```
 */
import { PrismaClient } from '@prisma/client';
import prisma from '../../database/client';
import logger from '../../utils/logger';
import {
  IPaymentProvider,
  ProviderConfig,
} from '../../types/payment-provider.types';
import { DarajaProvider } from './DarajaProvider';
import { FlutterwaveProvider } from './FlutterwaveProvider';
import { decrypt, isEncrypted } from '../../utils/crypto';

export class PaymentProviderFactory {
  private static prisma: PrismaClient = prisma;
  private static providerCache: Map<string, IPaymentProvider> = new Map();
  private static configCache: Map<string, ProviderConfig[]> = new Map();

  /**
   * Get a payment provider instance for a specific school (tenant).
   * Caches provider instances and reuses them for the lifetime of the process.
   *
   * @param schoolId - The school/tenant ID
   * @param providerName - Optional specific provider (e.g., "MPESA", "FLUTTERWAVE")
   * @returns An initialized IPaymentProvider instance
   * @throws Error if no active provider is configured for the school
   */
  static async getProvider(
    schoolId: string,
    providerName?: string
  ): Promise<IPaymentProvider> {
    const cacheKey = `${schoolId}:${providerName || 'primary'}`;

    // Check cache first
    const cached = this.providerCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Load configs from DB
    const configs = await this.loadConfigs(schoolId);
    if (configs.length === 0) {
      throw new Error(
        `No active payment provider configured for school: ${schoolId}`
      );
    }

    // Find the requested provider or the first active one
    let config: ProviderConfig | undefined;
    if (providerName) {
      config = configs.find(
        (c) => c.provider === providerName.toUpperCase() && c.isActive
      );
    } else {
      // Use the primary (first active) provider
      config = configs.find((c) => c.isActive);
    }

    if (!config) {
      throw new Error(
        `No active payment provider found for school: ${schoolId}${providerName ? `, requested: ${providerName}` : ''}`
      );
    }

    // Create provider instance
    const provider = this.createProvider(config);
    this.providerCache.set(cacheKey, provider);

    logger.info('Payment provider initialized', {
      schoolId,
      provider: config.provider,
    });

    return provider;
  }

  /**
   * Get all configured providers for a school.
   */
  static async getProvidersForSchool(
    schoolId: string
  ): Promise<IPaymentProvider[]> {
    const configs = await this.loadConfigs(schoolId);
    return configs
      .filter((c) => c.isActive)
      .map((config) => {
        const cacheKey = `${schoolId}:${config.provider}`;
        const cached = this.providerCache.get(cacheKey);
        if (cached) return cached;

        const provider = this.createProvider(config);
        this.providerCache.set(cacheKey, provider);
        return provider;
      });
  }

  /**
   * List available provider types (names) for a school.
   */
  static async getAvailableProviders(schoolId: string): Promise<string[]> {
    const configs = await this.loadConfigs(schoolId);
    return configs.filter((c) => c.isActive).map((c) => c.provider);
  }

  /**
   * Invalidate the cache for a school (call this when config changes).
   */
  static invalidateCache(schoolId?: string): void {
    if (schoolId) {
      // Clear all cache entries for this school
      for (const key of this.providerCache.keys()) {
        if (key.startsWith(schoolId)) {
          this.providerCache.delete(key);
        }
      }
      this.configCache.delete(schoolId);
    } else {
      this.providerCache.clear();
      this.configCache.clear();
    }
    logger.info('Payment provider cache invalidated', { schoolId: schoolId || 'all' });
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private static async loadConfigs(schoolId: string): Promise<ProviderConfig[]> {
    if (this.configCache.has(schoolId)) {
      return this.configCache.get(schoolId)!;
    }

    // Load from payment_provider_configs table (Prisma model)
    const records = await this.prisma.paymentProviderConfig.findMany({
      where: { schoolId, isActive: true },
    });

    const configs: ProviderConfig[] = records.map((r) => ({
      id: r.id,
      schoolId: r.schoolId,
      provider: r.provider,
      apiKey: isEncrypted(r.apiKey) ? decrypt(r.apiKey) : r.apiKey,
      secretKey: isEncrypted(r.secretKey) ? decrypt(r.secretKey) : r.secretKey,
      callbackUrl: r.callbackUrl || undefined,
      webhookSecret: r.webhookSecret || undefined,
      isActive: r.isActive,
      extraConfig: (r.extraConfig as Record<string, string>) || undefined,
    }));

    this.configCache.set(schoolId, configs);
    return configs;
  }

  private static createProvider(config: ProviderConfig): IPaymentProvider {
    switch (config.provider.toUpperCase()) {
      case 'MPESA':
        return new DarajaProvider(config);
      case 'FLUTTERWAVE':
        return new FlutterwaveProvider(config as any);
      // Future providers:
      // case 'STRIPE':
      //   return new StripeProvider(config);
      default:
        throw new Error(`Unsupported payment provider: ${config.provider}`);
    }
  }
}