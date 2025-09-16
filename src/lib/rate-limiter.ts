interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
  timestamp: number;
}

interface RateLimitConfig {
  maxRequestsPerSecond: number;
  maxConcurrentRequests: number;
  queueTimeout: number; // milliseconds
  retryDelay: number; // milliseconds for rate limit errors
  maxRetries: number;
}

export class RateLimiter {
  private queue: QueuedRequest[] = [];
  private activeRequests: number = 0;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private windowStart: number = Date.now();
  private processing: boolean = false;
  
  private config: RateLimitConfig = {
    maxRequestsPerSecond: 10, // Broadstreet API limit
    maxConcurrentRequests: 5,
    queueTimeout: 30000, // 30 seconds
    retryDelay: 1000, // 1 second
    maxRetries: 3
  };

  constructor(config?: Partial<RateLimitConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Add a request to the rate-limited queue
   */
  async enqueue<T>(
    requestFn: () => Promise<T>,
    priority: number = 0,
    requestId?: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        execute: requestFn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      // Insert request based on priority (higher priority first)
      const insertIndex = this.queue.findIndex(req => req.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(queuedRequest);
      } else {
        this.queue.splice(insertIndex, 0, queuedRequest);
      }

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.queue.findIndex(req => req.requestId === queuedRequest.requestId);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(new Error(`Request ${queuedRequest.requestId} timed out in queue`));
        }
      }, this.config.queueTimeout);

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 || this.activeRequests > 0) {
      // Clean up expired requests
      this.cleanupExpiredRequests();

      // Check if we can process more requests
      if (this.queue.length === 0 || 
          this.activeRequests >= this.config.maxConcurrentRequests ||
          !this.canMakeRequest()) {
        await this.sleep(100); // Wait 100ms before checking again
        continue;
      }

      // Get next request from queue
      const request = this.queue.shift();
      if (!request) continue;

      // Execute request with rate limiting
      this.executeRequest(request);
    }

    this.processing = false;
  }

  /**
   * Execute a single request with retry logic
   */
  private async executeRequest(request: QueuedRequest, retryCount: number = 0): Promise<void> {
    this.activeRequests++;
    this.updateRequestCount();

    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error: any) {
      // Check if it's a rate limit error
      if (this.isRateLimitError(error) && retryCount < this.config.maxRetries) {
        // Re-queue with delay for rate limit errors
        setTimeout(() => {
          this.executeRequest(request, retryCount + 1);
        }, this.config.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return;
      }
      
      request.reject(error);
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Check if we can make a request based on rate limits
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // Reset window if more than 1 second has passed
    if (now - this.windowStart >= 1000) {
      this.windowStart = now;
      this.requestCount = 0;
    }

    // Check if we're within rate limits
    return this.requestCount < this.config.maxRequestsPerSecond;
  }

  /**
   * Update request count for rate limiting
   */
  private updateRequestCount(): void {
    const now = Date.now();
    
    // Reset window if more than 1 second has passed
    if (now - this.windowStart >= 1000) {
      this.windowStart = now;
      this.requestCount = 0;
    }
    
    this.requestCount++;
    this.lastRequestTime = now;
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    return error.status === 429 || 
           error.code === 'RATE_LIMITED' ||
           (error.message && error.message.toLowerCase().includes('rate limit'));
  }

  /**
   * Clean up expired requests from queue
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    const expiredIndexes: number[] = [];
    
    this.queue.forEach((request, index) => {
      if (now - request.timestamp > this.config.queueTimeout) {
        expiredIndexes.push(index);
      }
    });
    
    // Remove expired requests (in reverse order to maintain indexes)
    expiredIndexes.reverse().forEach(index => {
      const expiredRequest = this.queue.splice(index, 1)[0];
      expiredRequest.reject(new Error(`Request ${expiredRequest.requestId} expired in queue`));
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue status
   */
  getStatus(): {
    queueLength: number;
    activeRequests: number;
    requestsThisSecond: number;
    canMakeRequest: boolean;
  } {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      requestsThisSecond: this.requestCount,
      canMakeRequest: this.canMakeRequest()
    };
  }

  /**
   * Clear the queue (useful for cancelling all pending requests)
   */
  clearQueue(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance for Broadstreet API
export const broadstreetRateLimiter = new RateLimiter({
  maxRequestsPerSecond: 10, // Conservative limit for Broadstreet API
  maxConcurrentRequests: 5,
  queueTimeout: 60000, // 1 minute timeout for sync operations
  retryDelay: 2000, // 2 second initial delay for rate limit retries
  maxRetries: 3
});

// Helper function to wrap API calls with rate limiting
export async function withRateLimit<T>(
  apiCall: () => Promise<T>,
  priority: number = 0,
  requestId?: string
): Promise<T> {
  return broadstreetRateLimiter.enqueue(apiCall, priority, requestId);
}
