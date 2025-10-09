import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  appStartTime: number
  authLoadTime: number | null
  branchLoadTime: number | null
  firstContentfulPaint: number | null
  timeToInteractive: number | null
  cacheHitRate: number
  totalLoadTime: number | null
}

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    appStartTime: Date.now(),
    authLoadTime: null,
    branchLoadTime: null,
    firstContentfulPaint: null,
    timeToInteractive: null,
    cacheHitRate: 0,
    totalLoadTime: null
  })

  useEffect(() => {
    // Measure First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({
              ...prev,
              firstContentfulPaint: entry.startTime
            }))
          }
        }
      })
      
      observer.observe({ entryTypes: ['paint'] })
      
      return () => observer.disconnect()
    }
  }, [])

  const recordAuthLoadTime = (loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      authLoadTime: loadTime,
      totalLoadTime: Date.now() - prev.appStartTime
    }))
  }

  const recordBranchLoadTime = (loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      branchLoadTime: loadTime,
      totalLoadTime: Date.now() - prev.appStartTime
    }))
  }

  const recordCacheHit = () => {
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: prev.cacheHitRate + 1
    }))
  }

  const recordTimeToInteractive = () => {
    setMetrics(prev => ({
      ...prev,
      timeToInteractive: Date.now() - prev.appStartTime
    }))
  }

  const logMetrics = () => {
    console.log('📊 Performance Metrics:', {
      'App Start Time': `${metrics.appStartTime}ms`,
      'Auth Load Time': metrics.authLoadTime ? `${metrics.authLoadTime}ms` : 'Not loaded',
      'Branch Load Time': metrics.branchLoadTime ? `${metrics.branchLoadTime}ms` : 'Not loaded',
      'First Contentful Paint': metrics.firstContentfulPaint ? `${metrics.firstContentfulPaint}ms` : 'Not measured',
      'Time to Interactive': metrics.timeToInteractive ? `${metrics.timeToInteractive}ms` : 'Not measured',
      'Cache Hit Rate': metrics.cacheHitRate,
      'Total Load Time': metrics.totalLoadTime ? `${metrics.totalLoadTime}ms` : 'Still loading'
    })
  }

  return {
    metrics,
    recordAuthLoadTime,
    recordBranchLoadTime,
    recordCacheHit,
    recordTimeToInteractive,
    logMetrics
  }
}





