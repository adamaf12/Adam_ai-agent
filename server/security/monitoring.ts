import type { Request, Response, NextFunction } from 'express';

interface SystemMetrics {
  totalRequests: number;
  totalErrors: number;
  rateLimitHits: number;
  promptInjectionBlocks: number;
  activeSessions: Set<string>;
  recentLatencies: number[]; // rolling 100
  startTime: number;
}

class SystemMonitor {
  private metrics: SystemMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    rateLimitHits: 0,
    promptInjectionBlocks: 0,
    activeSessions: new Set<string>(),
    recentLatencies: [],
    startTime: Date.now(),
  };

  /**
   * Express middleware to track response times and error rates
   */
  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      this.metrics.totalRequests++;

      const sessionId = req.user?.sessionId || req.user?.uid;
      if (sessionId) {
        this.metrics.activeSessions.add(sessionId);
        // Clean active sessions periodically
        if (this.metrics.activeSessions.size > 5000) {
          this.metrics.activeSessions.clear();
        }
      }

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.metrics.recentLatencies.push(duration);
        if (this.metrics.recentLatencies.length > 100) {
          this.metrics.recentLatencies.shift();
        }

        if (res.statusCode >= 400 && res.statusCode !== 404) {
          this.metrics.totalErrors++;
          if (res.statusCode === 429) {
            this.metrics.rateLimitHits++;
          }
        }
      });

      next();
    };
  }

  public recordPromptInjectionBlock() {
    this.metrics.promptInjectionBlocks++;
  }

  public getSnapshot() {
    const memory = process.memoryUsage();
    const uptimeSec = Math.floor((Date.now() - this.metrics.startTime) / 1000);
    const rpm = uptimeSec > 0 ? Math.round((this.metrics.totalRequests / (uptimeSec / 60)) * 10) / 10 : 0;

    const latencies = [...this.metrics.recentLatencies].sort((a, b) => a - b);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const p95Latency = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1] : 0;

    const errorRate = this.metrics.totalRequests > 0
      ? Math.round((this.metrics.totalErrors / this.metrics.totalRequests) * 1000) / 10
      : 0;

    return {
      uptimeSeconds: uptimeSec,
      requestsPerMinute: rpm,
      totalRequests: this.metrics.totalRequests,
      errorRatePercent: errorRate,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      activeSessions: this.metrics.activeSessions.size,
      rateLimitHits: this.metrics.rateLimitHits,
      promptInjectionBlocks: this.metrics.promptInjectionBlocks,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
      status: errorRate > 15 ? 'DEGRADED' : 'HEALTHY',
    };
  }
}

export const systemMonitor = new SystemMonitor();
