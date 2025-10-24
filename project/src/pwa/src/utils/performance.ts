export const measurePageLoad = () => {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    const perfData = window.performance.timing
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
    const connectTime = perfData.responseEnd - perfData.requestStart
    const renderTime = perfData.domComplete - perfData.domLoading

    console.log('📊 Performance Metrics:')
    console.log('Page Load Time:', pageLoadTime, 'ms')
    console.log('Connect Time:', connectTime, 'ms')
    console.log('Render Time:', renderTime, 'ms')

    // Send to analytics (optional)
    // analytics.track('page_load', { pageLoadTime, connectTime, renderTime })
  })
}

// Call in main.tsx
measurePageLoad()