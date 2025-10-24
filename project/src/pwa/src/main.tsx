import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ✅ Import React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// ✅ Create QueryClient with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,           // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000,             // Keep unused data in cache for 10 minutes
      refetchOnWindowFocus: false,        // Don't refetch when window gains focus
      refetchOnReconnect: true,           // Refetch when internet reconnects
      retry: 1,                            // Retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    }
  }
})

// ✅ Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope)
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ Wrap App with QueryClientProvider */}
      <QueryClientProvider client={queryClient}>
        <App />
        {/* ✅ DevTools - only shows in development */}
        {/* Fixed: position should be 'bottom' | 'top' | 'left' | 'right' */}
        {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
          )}

      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)