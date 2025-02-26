/**
 * Structured Logger for MongoDB Operations
 * 
 * Provides a consistent logging interface with support for different log levels,
 * structured metadata, and environment-aware behavior.
 */

/**
 * Log levels for the logger
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Log entry interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: Record<string, any>;
}

/**
 * Logger options interface
 */
export interface LoggerOptions {
  /**
   * Minimum log level to output
   * @default LogLevel.INFO
   */
  minLevel?: LogLevel;
  
  /**
   * Context to include with all log entries
   */
  context?: string;
  
  /**
   * Whether to include timestamps in logs
   * @default true
   */
  timestamps?: boolean;
  
  /**
   * Whether to format output as JSON
   * @default false
   */
  json?: boolean;
}

/**
 * Order of log levels for comparison
 */
const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3
};

/**
 * Default logger options
 */
const DEFAULT_OPTIONS: LoggerOptions = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  timestamps: true,
  json: process.env.NODE_ENV === 'production'
};

/**
 * Structured Logger
 * 
 * Provides consistent logging with support for different log levels and
 * structured metadata.
 */
export class Logger {
  private readonly options: Required<LoggerOptions>;
  
  /**
   * Create a new logger instance
   * @param options - Logger options
   */
  constructor(options: LoggerOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    } as Required<LoggerOptions>;
  }
  
  /**
   * Create a child logger with a specific context
   * @param context - Context for the child logger
   * @returns A new logger instance with the specified context
   */
  public child(context: string): Logger {
    return new Logger({
      ...this.options,
      context: this.options.context 
        ? `${this.options.context}:${context}` 
        : context
    });
  }
  
  /**
   * Log an error message
   * @param message - Error message
   * @param metadata - Additional metadata
   */
  public error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }
  
  /**
   * Log a warning message
   * @param message - Warning message
   * @param metadata - Additional metadata
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }
  
  /**
   * Log an info message
   * @param message - Info message
   * @param metadata - Additional metadata
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }
  
  /**
   * Log a debug message
   * @param message - Debug message
   * @param metadata - Additional metadata
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  
  /**
   * Log a message with the specified level
   * @param level - Log level
   * @param message - Log message
   * @param metadata - Additional metadata
   */
  public log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    // Skip logging if the level is below the minimum level
    if (LOG_LEVEL_ORDER[level] > LOG_LEVEL_ORDER[this.options.minLevel]) {
      return;
    }
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: this.options.timestamps ? new Date().toISOString() : '',
      metadata
    };
    
    if (this.options.context) {
      entry.context = this.options.context;
    }
    
    this.output(entry);
  }
  
  /**
   * Output a log entry to the console
   * @param entry - Log entry to output
   */
  private output(entry: LogEntry): void {
    if (this.options.json) {
      // JSON output
      console[entry.level as keyof Console](JSON.stringify(entry));
    } else {
      // Formatted output
      const timestamp = entry.timestamp ? `[${entry.timestamp}] ` : '';
      const context = entry.context ? `[${entry.context}] ` : '';
      const prefix = `${timestamp}${context}${entry.level.toUpperCase()}: `;
      
      if (entry.metadata) {
        console[entry.level as keyof Console](prefix + entry.message, entry.metadata);
      } else {
        console[entry.level as keyof Console](prefix + entry.message);
      }
    }
  }
}

// Export singleton instance for convenience
export const logger = new Logger({ context: 'MongoDB' });
