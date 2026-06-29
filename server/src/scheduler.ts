import cron from 'node-cron';
import logger from './utils/logger';
import { SubscriptionLifecycleService } from './services/subscription-lifecycle.service';

const lifecycle = new SubscriptionLifecycleService();

/**
 * Initialize all scheduled cron jobs.
 * Call this once during server startup.
 */
export function initializeScheduler(): void {
  // Daily lifecycle run at midnight (00:00)
  // Runs every day at 00:00 server time
  cron.schedule('0 0 * * *', async () => {
    logger.info('Scheduler: Starting daily subscription lifecycle run');
    try {
      const report = await lifecycle.runAll();
      logger.info('Scheduler: Daily lifecycle run complete', { report });
    } catch (err: any) {
      logger.error('Scheduler: Daily lifecycle run failed', { error: err.message });
    }
  });

  logger.info('Scheduler initialized — daily lifecycle job registered for 00:00');
}