import React from 'react';

/**
 * Performance Monitoring Utilities
 * Provides tools for monitoring and optimizing application performance
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  /**
   * Start timing a performance metric
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End timing a performance metric
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log performance metric in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, metric.metadata || '');
    }

    return duration;
  }

  /**
   * Measure a function's execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Measure a synchronous function's execution time
   */
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(metric => metric.duration !== undefined);
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<string, { count: number; totalTime: number; averageTime: number; minTime: number; maxTime: number }> {
    const metrics = this.getMetrics();
    const summary: Record<string, any> = {};

    metrics.forEach(metric => {
      if (!metric.duration) return;

      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.totalTime += metric.duration;
      s.minTime = Math.min(s.minTime, metric.duration);
      s.maxTime = Math.max(s.maxTime, metric.duration);
      s.averageTime = s.totalTime / s.count;
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    if (!this.isEnabled) return;

    const summary = this.getSummary();
    console.table(summary);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook for measuring component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  const startRender = () => {
    performanceMonitor.start(`${componentName}-render`);
  };

  const endRender = () => {
    performanceMonitor.end(`${componentName}-render`);
  };

  return { startRender, endRender };
}

/**
 * Higher-order component for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
  
  return function PerformanceMonitoredComponent(props: P) {
    const { startRender, endRender } = usePerformanceMonitor(name);
    
    React.useEffect(() => {
      startRender();
      return endRender;
    });

    return <Component {...props} />;
  };
}

/**
 * Decorator for measuring API call performance
 */
export function measureApiCall(endpoint: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = async function (this: any, ...args: any[]) {
      return performanceMonitor.measure(
        `api-${endpoint}`,
        () => method.apply(this, args),
        { endpoint, args: args.length }
      );
    } as T;
  };
}

/**
 * Utility for measuring data fetching performance
 */
export async function measureDataFetch<T>(
  name: string,
  fetchFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMonitor.measure(`data-fetch-${name}`, fetchFn, metadata);
}

/**
 * Utility for measuring Zustand store operations
 */
export function measureStoreOperation<T>(
  storeName: string,
  operation: string,
  fn: () => T
): T {
  return performanceMonitor.measureSync(
    `store-${storeName}-${operation}`,
    fn,
    { store: storeName, operation }
  );
}

/**
 * Web Vitals monitoring (for production)
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }: any) => {
    onCLS?.(console.log);
    onFID?.(console.log);
    onFCP?.(console.log);
    onLCP?.(console.log);
    onTTFB?.(console.log);
  }).catch(() => {
    // web-vitals not available, skip
  });
}

/**
 * Memory usage monitoring
 */
export function logMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  console.log('Memory Usage:', {
    used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
    total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
    limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
  });
}
