import { logger } from '../http/Logger.js';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class RetryHandler {
  private readonly config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2,
      ...config
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if it's not a rate limit error
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        const delay = this.calculateDelay(attempt);
        logger.warn(`${operationName} failed (attempt ${attempt + 1}), retrying in ${delay}ms`, {
          error: error instanceof Error ? error.message : String(error),
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Check for rate limit errors
      if (message.includes('429') || message.includes('rate limit')) {
        return true;
      }
      // Check for temporary network errors
      if (message.includes('timeout') || message.includes('network') || message.includes('connection')) {
        return true;
      }
    }
    return false;
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt);
    return Math.min(delay, this.config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}