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

export class PaymentProviderFactory {
  private static prisma: PrismaClient = prisma;
  private static providerCache: Map<string, IPaymentProvider> = new Map();
  private static configCache: Map<string, ProviderConfig[]> = new Map();

  /**
   * Get a payment provider instance for a specific tenant (school).
   * Caches provider instances and reuses them for the lifetime of the process.
   *
   * @param tenantId - The school/tenant ID
   * @param providerName - Optional specific provider (e.g., "MPESA", "FLUTTERWAVE")
   * @returns An initialized IPaymentProvider instance
   * @throws Error if no active provider is configured for the tenant
   */
  static async getProvider(
    tenantId: string,
    providerName?: string
  ): Promise<IPaymentProvider> {
    const cacheKey = `${tenantId}:${providerName || 'primary'}`;

    // Check cache first
    const cached = this.providerCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Load configs from DB
    const configs = await this.loadConfigs(tenantId);
    if (configs.length === 0) {
      throw new Error(
        `No active payment provider configured for tenant: ${tenantId}`
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
        `No active payment provider found for tenant: ${tenantId}${providerName ? `, requested: ${providerName}` : ''}`
      );
    }

    // Create provider instance
    const provider = this.createProvider(config);
    this.providerCache.set(cacheKey, provider);

    logger.info('Payment provider initialized', {
      tenantId,
      provider: config.provider,
    });

    return provider;
  }

  /**
   * Get all configured providers for a tenant.
   */
  static async getProvidersForTenant(
    tenantId: string
  ): Promise<IPaymentProvider[]> {
    const configs = await this.loadConfigs(tenantId);
    return configs
      .filter((c) => c.isActive)
      .map((config) => {
        const cacheKey = `${tenantId}:${config.provider}`;
        const cached = this.providerCache.get(cacheKey);
        if (cached) return cached;

        const provider = this.createProvider(config);
        this.providerCache.set(cacheKey, provider);
        return provider;
      });
  }

  /**
   * List available provider types (names) for a tenant.
   */
  static async getAvailableProviders(tenantId: string): Promise<string[]> {
    const configs = await this.loadConfigs(tenantId);
    return configs.filter((c) => c.isActive).map((c) => c.provider);
  }

  /**
   * Invalidate the cache for a tenant (call this when config changes).
   */
  static invalidateCache(tenantId?: string): void {
    if (tenantId) {
      // Clear all cache entries for this tenant
      for (const key of this.providerCache.keys()) {
        if (key.startsWith(tenantId)) {
          this.providerCache.delete(key);
        }
      }
      this.configCache.delete(tenantId);
    } else {
      this.providerCache.clear();
      this.configCache.clear();
    }
    logger.info('Payment provider cache invalidated', { tenantId: tenantId || 'all' });
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private static async loadConfigs(tenantId: string): Promise<ProviderConfig[]> {
    if (this.configCache.has(tenantId)) {
      return this.configCache.get(tenantId)!;
    }

    // Load from payment_provider_configs table (Prisma model)
    const records = await this.prisma.paymentProviderConfig.findMany({
      where: { tenantId, isActive: true },
    });

    const configs: ProviderConfig[] = records.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      provider: r.provider,
      apiKey: r.apiKey,
      secretKey: r.secretKey,
      callbackUrl: r.callbackUrl || undefined,
      webhookSecret: r.webhookSecret || undefined,
      isActive: r.isActive,
      extraConfig: (r.extraConfig as Record<string, string>) || undefined,
    }));

    this.configCache.set(tenantId, configs);
    return configs;
  }

  private static createProvider(config: ProviderConfig): IPaymentProvider {
    switch (config.provider.toUpperCase()) {
      case 'MPESA':
        return new DarajaProvider(config);
      // Future providers:
      // case 'FLUTTERWAVE':
      //   return new FlutterwaveProvider(config);
      // case 'STRIPE':
      //   return new StripeProvider(config);
      default:
        throw new Error(`Unsupported payment provider: ${config.provider}`);
    }
  }
}