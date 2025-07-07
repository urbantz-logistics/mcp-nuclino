export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number = 150, timeWindowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMinutes * 60 * 1000; // Convert to milliseconds
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than the time window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      // Calculate how long to wait until the oldest request expires
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot(); // Recursively check again
      }
    }
    
    // Record this request
    this.requests.push(now);
  }

  getRequestCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    return this.requests.length;
  }
}