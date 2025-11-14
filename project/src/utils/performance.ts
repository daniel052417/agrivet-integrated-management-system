/**
 * Performance Monitoring Utilities
 * 
 * Provides utilities for monitoring and measuring application performance
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface ComponentRenderMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private renderMetrics: Map<string, ComponentRenderMetrics> = new Map();
  private maxMetrics = 100; // Keep last 100 metrics

  /**
   * Measure execution time of a function
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration, 'ms');
      throw error;
    }
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration, 'ms');
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}${unit}`);
    }
  }

  /**
   * Record component render metrics
   */
  recordRender(componentName: string, renderTime: number): void {
    const existing = this.renderMetrics.get(componentName);
    
    if (existing) {
      existing.renderCount += 1;
      existing.averageRenderTime = 
        (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.renderMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
      });
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average metric value by name
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get component render metrics
   */
  getRenderMetrics(): ComponentRenderMetrics[] {
    return Array.from(this.renderMetrics.values());
  }

  /**
   * Get render metrics for a specific component
   */
  getComponentRenderMetrics(componentName: string): ComponentRenderMetrics | null {
    return this.renderMetrics.get(componentName) || null;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.renderMetrics.clear();
  }

  /**
   * Get Web Vitals metrics
   */
  getWebVitals(): {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  } {
    const vitals: any = {};

    // Try to get Web Vitals from Performance API
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
        
        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
          }
        });
      }
    }

    return vitals;
  }

  /**
   * Measure page load time
   */
  getPageLoadTime(): number | null {
    if (typeof window === 'undefined') return null;
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return navigation.loadEventEnd - navigation.fetchStart;
    }
    
    return null;
  }

  /**
   * Measure memory usage (if available)
   */
  getMemoryUsage(): {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  } | null {
    if (typeof window === 'undefined') return null;
    
    const memory = (performance as any).memory;
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    
    return null;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function factory to measure component render time
 * Usage:
 * import React from 'react';
 * import { createPerformanceMonitor } from './utils/performance';
 * const withPerformanceMonitoring = createPerformanceMonitor(React);
 */
export function createPerformanceMonitor(React: any) {
  return function withPerformanceMonitoring<P extends object>(
    Component: React.ComponentType<P>,
    componentName?: string
  ): React.ComponentType<P> {
    const displayName = componentName || Component.displayName || Component.name || 'Unknown';
    
    return function PerformanceMonitoredComponent(props: P) {
      const renderStart = React.useRef(performance.now());
      
      React.useEffect(() => {
        const renderTime = performance.now() - renderStart.current;
        performanceMonitor.recordRender(displayName, renderTime);
      });
      
      return React.createElement(Component, props);
    };
  };
}

