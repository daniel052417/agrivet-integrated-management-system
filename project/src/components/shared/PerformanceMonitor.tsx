import React, { useEffect, useState } from 'react';
import { usePerformanceMetrics } from '../../hooks/usePerformance';
import { Activity, Zap, Clock, HardDrive } from 'lucide-react';

/**
 * Performance Monitor Component
 * Displays real-time performance metrics (development only)
 */
const PerformanceMonitor: React.FC<{ enabled?: boolean }> = ({ enabled = import.meta.env.DEV }) => {
  const { metrics, renderMetrics, webVitals, pageLoadTime, memoryUsage } = usePerformanceMetrics();
  const [isVisible, setIsVisible] = useState(false);

  if (!enabled) {
    return null;
  }

  const recentMetrics = metrics.slice(-10).reverse();
  const slowComponents = renderMetrics
    .filter(m => m.averageRenderTime > 16) // > 16ms (60fps threshold)
    .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
    .slice(0, 5);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Show Performance Monitor"
        >
          <Activity className="w-5 h-5" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <h3 className="font-semibold">Performance Monitor</h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* Web Vitals */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                Web Vitals
              </h4>
              <div className="space-y-1 text-sm">
                {webVitals.fcp && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Contentful Paint:</span>
                    <span className="font-mono">{webVitals.fcp.toFixed(0)}ms</span>
                  </div>
                )}
                {pageLoadTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Page Load Time:</span>
                    <span className="font-mono">{pageLoadTime.toFixed(0)}ms</span>
                  </div>
                )}
                {webVitals.ttfb && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time to First Byte:</span>
                    <span className="font-mono">{webVitals.ttfb.toFixed(0)}ms</span>
                  </div>
                )}
              </div>
            </div>

            {/* Memory Usage */}
            {memoryUsage && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <HardDrive className="w-4 h-4 mr-1" />
                  Memory Usage
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-mono">
                      {(memoryUsage.usedJSHeapSize! / 1048576).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-mono">
                      {(memoryUsage.totalJSHeapSize! / 1048576).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Limit:</span>
                    <span className="font-mono">
                      {(memoryUsage.jsHeapSizeLimit! / 1048576).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Slow Components */}
            {slowComponents.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Slow Components
                </h4>
                <div className="space-y-2">
                  {slowComponents.map((component) => (
                    <div key={component.componentName} className="text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          {component.componentName}
                        </span>
                        <span className="text-red-600 font-mono">
                          {component.averageRenderTime.toFixed(1)}ms
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Renders: {component.renderCount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Metrics */}
            {recentMetrics.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Recent Metrics</h4>
                <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                  {recentMetrics.map((metric, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600 truncate">{metric.name}:</span>
                      <span className="font-mono text-gray-800">
                        {metric.value.toFixed(2)}{metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Development Mode Only
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;



