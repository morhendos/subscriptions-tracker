import { toast } from '@/components/ui/use-toast';

interface MonitoringEvent {
  type: 'warn' | 'error' | 'info';
  message: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

/**
 * Centralized monitoring service
 * This will make it easy to switch monitoring providers later
 */
class MonitoringService {
  private static instance: MonitoringService;
  private isDev = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Log an event to all configured monitoring systems
   */
  async logEvent(event: MonitoringEvent) {
    const timestamp = event.timestamp || new Date().toISOString();
    
    // Always log to console
    if (event.type === 'error') {
      console.error(`[${timestamp}] ${event.message}`, event.metadata);
    } else if (event.type === 'warn') {
      console.warn(`[${timestamp}] ${event.message}`, event.metadata);
    } else {
      console.log(`[${timestamp}] ${event.message}`, event.metadata);
    }

    // In development, also show toast notifications for important events
    if (this.isDev && (event.type === 'error' || event.type === 'warn')) {
      toast({
        title: event.type === 'error' ? 'Error' : 'Warning',
        description: event.message,
        variant: event.type === 'error' ? 'destructive' : 'default',
      });
    }

    // Here you can add more monitoring services like:
    // - DataDog
    // - New Relic
    // - CloudWatch
    // - Sentry
    // etc.
  }

  error(message: string, metadata?: Record<string, any>) {
    return this.logEvent({ type: 'error', message, metadata });
  }

  warn(message: string, metadata?: Record<string, any>) {
    return this.logEvent({ type: 'warn', message, metadata });
  }

  info(message: string, metadata?: Record<string, any>) {
    return this.logEvent({ type: 'info', message, metadata });
  }
}

export const monitoring = MonitoringService.getInstance();